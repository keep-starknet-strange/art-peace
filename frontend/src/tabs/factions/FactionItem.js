import React, { useState, useEffect, useRef } from 'react';
import './FactionItem.css';
import { convertUrl } from '../../utils/Consts.js';
import { useContractWrite } from '@starknet-react/core';
import {
  getChainFactionMembers,
  getFactionMembers,
  addFactionTemplateDevnet,
  fetchWrapper
} from '../../services/apiService.js';
import { PaginationView } from '../../ui/pagination.js';
import TemplateItem from '../templates/TemplateItem.js';
import Template from '../../resources/icons/Template.png';
import Info from '../../resources/icons/Info.png';
import { devnetMode } from '../../utils/Consts.js';

const FactionItem = (props) => {
  // TODO: Faction owner tabs: allocations, ...
  const factionsSubTabs = ['templates', 'info'];
  const [innerActiveTab, setInnerActiveTab] = useState(factionsSubTabs[0]);
  const [members, setMembers] = useState([]);
  const [membersPagination, setMembersPagination] = useState({
    pageLength: 10,
    page: 1
  });
  useEffect(() => {
    let newPagination = {
      pageLength: 10,
      page: 1
    };
    setMembersPagination(newPagination);
  }, [props.faction]);

  useEffect(() => {
    const createShorthand = (name) => {
      if (name.length > 12) {
        // If starts with 0x
        return name.slice(0, 2) === '0x'
          ? `${name.slice(0, 6)}...${name.slice(-4)}`
          : `${name.slice(0, 10)}...`;
      } else {
        return name;
      }
    };
    async function getMembers() {
      try {
        let result = [];
        if (props.isChain) {
          result = await getChainFactionMembers({
            factionId: props.faction.factionId,
            page: membersPagination.page,
            pageLength: membersPagination.pageLength
          });
        } else {
          result = await getFactionMembers({
            factionId: props.faction.factionId,
            page: membersPagination.page,
            pageLength: membersPagination.pageLength
          });
        }
        if (!result.data || result.data.length === 0) {
          setMembers([]);
          return;
        }
        let shortenedMembers = [];
        result.data.forEach((member) => {
          let name =
            member.username == '' ? '0x' + member.userAddress : member.username;
          shortenedMembers.push({
            name: createShorthand(name),
            allocation: member.totalAllocation
          });
        });
        setMembers(shortenedMembers);
      } catch (error) {
        console.log(error);
      }
    }
    getMembers();
  }, [props.faction, membersPagination.page, membersPagination.pageLength]);

  const [factionTemplates, setFactionTemplates] = useState([]);
  useEffect(() => {
    async function getTemplates() {
      let getFactionTemplatesUrl = '';
      if (props.isChain) {
        getFactionTemplatesUrl = `get-chain-faction-templates?factionId=${props.faction.factionId}`;
      } else {
        getFactionTemplatesUrl = `get-faction-templates?factionId=${props.faction.factionId}`;
      }
      let templates = await fetchWrapper(getFactionTemplatesUrl);
      if (!templates.data) {
        setFactionTemplates([]);
        return;
      }
      setFactionTemplates(templates.data);
    }
    getTemplates();
  }, [props.faction]);

  const [canJoin, setCanJoin] = useState(true);
  useEffect(() => {
    if (props.queryAddress === '0' || props.gameEnded) {
      setCanJoin(false);
      return;
    }
    if (props.faction.isMember || !props.faction.joinable) {
      setCanJoin(false);
      return;
    }
    if (props.isChain && props.userInChainFaction) {
      setCanJoin(false);
      return;
    }
    if (!props.isChain && props.userInFaction) {
      setCanJoin(false);
      return;
    }
    setCanJoin(true);
  }, [props]);

  let [owner, setOwner] = useState(false);
  useEffect(() => {
    if (props.faction.leader === props.queryAddress) {
      setOwner(true);
    } else if (props.host === props.queryAddress) {
      setOwner(true);
    } else {
      setOwner(false);
    }
  }, [props.faction, props.queryAddress]);

  // TODO:  metadata
  const [calls, setCalls] = useState([]);
  const addStencilCall = (metadata) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract) return;
    if (!metadata) return;
    setCalls(
      props.artPeaceContract.populateTransaction['add_faction_template'](
        metadata
      )
    );
  };

  useEffect(() => {
    const addTemplate = async () => {
      if (devnetMode) return;
      if (calls.length === 0) return;
      await writeAsync();
      console.log('Stencil added successful:', data, isPending);
    };
    addTemplate();
  }, [calls]);

  const { writeAsync, data, isPending } = useContractWrite({
    calls
  });

  const imageToPalette = (image) => {
    // Convert image pixels to be within the color palette

    // Get image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;

    let imagePalleteIds = [];
    // Convert image data to color palette
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 0;
        imagePalleteIds.push(255);
        continue;
      }
      let minDistance = 1000000;
      let minColor = props.colors[0];
      let minColorIndex = 0;
      for (let j = 0; j < props.colors.length; j++) {
        const color = props.colors[j]
          .match(/[A-Za-z0-9]{2}/g)
          .map((x) => parseInt(x, 16));
        const distance = Math.sqrt(
          Math.pow(data[i] - color[0], 2) +
            Math.pow(data[i + 1] - color[1], 2) +
            Math.pow(data[i + 2] - color[2], 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          minColor = color;
          minColorIndex = j;
        }
      }
      data[i] = minColor[0];
      data[i + 1] = minColor[1];
      data[i + 2] = minColor[2];
      imagePalleteIds.push(minColorIndex);
    }

    // Set image data back to canvas
    ctx.putImageData(imageData, 0, 0);
    return [canvas.toDataURL(), imagePalleteIds];
  };

  const inputFile = useRef();
  const uploadTemplate = () => {
    // Open file upload dialog
    inputFile.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file === undefined) {
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
      var image = new Image();
      image.src = e.target.result;

      image.onload = function () {
        var height = this.height;
        var width = this.width;
        if (height < 5 || width < 5) {
          alert(
            'Image is too small, minimum size is 5x5. Given size is ' +
              width +
              'x' +
              height
          );
          return;
        }
        if (height > 64 || width > 64) {
          alert(
            'Image is too large, maximum size is 64x64. Given size is ' +
              width +
              'x' +
              height
          );
          return;
        }
        const [paletteImage, colorIds] = imageToPalette(image);
        // TODO: Upload to backend and get template hash back
        props.setTemplateFaction(props.faction);
        let templateImage = {
          image: paletteImage,
          width: width,
          height: height
        };
        props.setTemplateImage(templateImage);
        props.setTemplateColorIds(colorIds);
        props.setTemplateCreationMode(true);
        props.setTemplateCreationSelected(false);
        props.setActiveTab('Canvas');
      };
    };
  };

  const _addStencil = async () => {
    if (props.queryAddress === '0') {
      return;
    }
    let metadata = {
      factionId: props.faction.factionId.toString(),
      hash: '0',
      position: '0',
      width: '32',
      height: '32'
    };
    if (!devnetMode) {
      // TODO: Add stencil to the faction
      addStencilCall(metadata);
      return;
    }
    try {
      console.log('Adding stencil...', metadata);
      // TODO: chain vs non-chain
      const result = await addFactionTemplateDevnet(metadata);
      if (result.result) {
        console.log('Stencil added successful:', result);
        // TODO: Add stencil to the faction
      } else {
        console.log('Error adding stencil to devnet:', result);
      }
    } catch (error) {
      console.log('Error adding stencil:', error);
    }
  };

  return (
    <div className='FactionItem'>
      <div className='FactionItem__heading'>
        <div className='FactionItem__heading__inner'>
          <img
            src={convertUrl(props.faction.icon)}
            alt={props.faction.name}
            className='FactionItem__icon'
          />
          <div className='FactionItem__header__info'>
            <h2 className='Text__large FactionItem__name'>
              {props.faction.name}
            </h2>
            <div className='FactionItem__header__info__links'>
              {props.faction.telegram && (
                <a
                  className='FactionItem__link'
                  href={props.faction.telegram}
                  target='_blank'
                  rel='noreferrer'
                >
                  <img
                    src='https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg'
                    alt='Telegram'
                    className='FactionItem__link__icon'
                  />
                </a>
              )}
              {props.faction.twitter && (
                <a
                  className='FactionItem__link'
                  href={props.faction.twitter}
                  target='_blank'
                  rel='noreferrer'
                >
                  <img
                    src='https://upload.wikimedia.org/wikipedia/commons/c/cc/X_icon.svg'
                    alt='X'
                    className='FactionItem__link__icon'
                  />
                </a>
              )}
              {props.faction.github && (
                <a
                  className='FactionItem__link'
                  href={props.faction.github}
                  target='_blank'
                  rel='noreferrer'
                >
                  <img
                    src='https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg'
                    alt='Github'
                    className='FactionItem__link__icon'
                  />
                </a>
              )}
              {props.faction.site && (
                <a
                  className='FactionItem__link'
                  style={{ border: '1px solid rgba(0, 0, 0, 0.5)' }}
                  href={props.faction.site}
                  target='_blank'
                  rel='noreferrer'
                >
                  <img
                    src='https://upload.wikimedia.org/wikipedia/commons/5/58/Echo_link-blue_icon_slanted.svg'
                    alt='Hyperlink'
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '50%',
                      padding: '0.2rem'
                    }}
                    className='FactionItem__link__icon'
                  />
                </a>
              )}
            </div>
            <div className='FactionItem__header__info__links'>
              {false && (
                <div
                  className={`Text__xsmall Button__primary FactionItem__header__button`}
                  style={{ marginRight: '0.5rem', borderRadius: '2rem' }}
                >
                  <p style={{ padding: '0.5rem 0', margin: '0' }}>
                    {props.faction.isMember ? 'Exit' : 'Join'}
                  </p>
                </div>
              )}
              {canJoin && (
                <div
                  className={`Text__xsmall Button__primary FactionItem__header__button`}
                  style={{ borderRadius: '2rem' }}
                  onClick={() => {
                    if (props.isChain) {
                      props.setModal({
                        title: 'Join Chain Faction',
                        text: `You can only join one Chain Faction.\nAre you sure you want to join the ${props.faction.name} Faction`,
                        confirm: 'Join',
                        action: () => {
                          props.joinChain(props.faction.factionId);
                        }
                      });
                      return;
                    } else {
                      props.setModal({
                        title: 'Join Faction',
                        text: `You can only join one Faction.\nAre you sure you want to join the ${props.faction.name} Faction`,
                        confirm: 'Join',
                        action: () => {
                          props.joinFaction(props.faction.factionId);
                        }
                      });
                      return;
                    }
                  }}
                >
                  <p style={{ padding: '0.5rem 0', margin: '0' }}>Join</p>
                </div>
              )}
              <div
                className={`Text__xsmall Button__primary FactionItem__header__template__button 
                  ${innerActiveTab === 'templates' ? 'FactionItem__header__button--selected' : ''}`}
                onClick={() => setInnerActiveTab('templates')}
              >
                <img
                  src={Template}
                  alt='Template'
                  style={{
                    width: '3rem',
                    height: '3rem',
                    padding: '0',
                    marginRight: '0.5rem'
                  }}
                />
                <p style={{ padding: '0', margin: '0' }}>stencils</p>
              </div>
              <div
                className={`FactionItem__link ${innerActiveTab === 'info' ? 'FactionItem__header__button--selected' : ''}`}
                style={{ border: '1px solid rgba(0, 0, 0, 0.5)' }}
                onClick={() => setInnerActiveTab('info')}
              >
                <img
                  src={Info}
                  alt='Info'
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '50%',
                    padding: '0.2rem',
                    width: '3rem',
                    height: '3rem'
                  }}
                  className='FactionItem__link__icon'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='FactionItem__info'>
        {innerActiveTab === 'templates' && (
          <div>
            {factionTemplates.length === 0 && (
              <p className='Text__medium FactionItem__stencil__text'>
                No stencils available...
              </p>
            )}
            {factionTemplates.map((template, index) => {
              return (
                <TemplateItem
                  key={index}
                  template={template}
                  setTemplateOverlayMode={props.setTemplateOverlayMode}
                  setOverlayTemplate={props.setOverlayTemplate}
                  setInnerActiveTab={props.setInnerActiveTab}
                  setActiveTab={props.setActiveTab}
                />
              );
            })}
            {owner && (
              <div>
                <div
                  className='Button__primary FactionItem__stencil__button'
                  onClick={uploadTemplate}
                >
                  Add stencil
                </div>
                <input
                  type='file'
                  id='file'
                  accept='.png'
                  ref={inputFile}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            )}
          </div>
        )}
        {innerActiveTab === 'info' && (
          <div style={{ width: '100%' }}>
            <div className='FactionItem__info__header'>
              <h3 className='Text__medium FactionItem__info__text'>
                Pool: {props.faction.members * props.factionAlloc}px
              </h3>
              <h3 className='Text__medium FactionItem__info__text'>Alloc</h3>
            </div>
            <div className='FactionItem__info__members'>
              {members.map((member, index) => {
                return (
                  <div key={index} className='FactionItem__info__member'>
                    <p className='Text__medium FactionItem__info__text'>
                      {member.name}
                    </p>
                    <p className='Text__small FactionItem__info__text'>
                      {member.allocation === 0 ? '-' : `${member.allocation}px`}
                    </p>
                  </div>
                );
              })}
              <PaginationView
                data={members}
                stateValue={membersPagination}
                setState={setMembersPagination}
              />
            </div>
          </div>
        )}
      </div>
      <p
        className='Button__close FactionItem__close'
        onClick={() => props.clearFactionSelection()}
      >
        X
      </p>
    </div>
  );
};
// TODO: Pagination

export default FactionItem;
