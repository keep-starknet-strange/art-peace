import React, { useState, useEffect } from 'react';
import './FactionItem.css';
import { convertUrl } from '../../utils/Consts.js';
import {
  getChainFactionMembers,
  getFactionMembers
} from '../../services/apiService.js';
import { PaginationView } from '../../ui/pagination.js';
import TemplateItem from '../templates/TemplateItem.js';
import Template from '../../resources/icons/Template.png';
import Info from '../../resources/icons/Info.png';

const FactionItem = (props) => {
  // TODO: Faction owner tabs: allocations, ...
  const factionsSubTabs = ['templates', 'info'];
  const [activeTab, setActiveTab] = useState(factionsSubTabs[0]);
  const [_leader, _setLeader] = useState('Brandon'); // TODO: Fetch leader & show in members info
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

  const factionTemplates = [
    {
      name: 'My Template 1',
      image: convertUrl(props.faction.icon),
      width: 32,
      height: 32,
      position: 25
    },
    {
      name: 'My Template With long name 2',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      width: 25,
      height: 20,
      position: 47
    },
    {
      name: 'My Template 3',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      width: 25,
      height: 20,
      position: 47
    },
    {
      name: 'My Template 3',
      image: 'https://www.w3schools.com/w3images/mountains.jpg',
      width: 20,
      height: 20,
      position: 0
    }
  ];

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
                      props.joinChain(props.faction.factionId);
                    } else {
                      props.joinFaction(props.faction.factionId);
                    }
                  }}
                >
                  <p style={{ padding: '0.5rem 0', margin: '0' }}>Join</p>
                </div>
              )}
              <div
                className={`Text__xsmall Button__primary FactionItem__header__template__button 
                  ${activeTab === 'templates' ? 'FactionItem__header__button--selected' : ''}`}
                onClick={() => setActiveTab('templates')}
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
                className={`FactionItem__link ${activeTab === 'info' ? 'FactionItem__header__button--selected' : ''}`}
                style={{ border: '1px solid rgba(0, 0, 0, 0.5)' }}
                onClick={() => setActiveTab('info')}
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
        {activeTab === 'templates' &&
          factionTemplates.map((template, index) => {
            return (
              <TemplateItem
                key={index}
                template={template}
                setTemplateOverlayMode={props.setTemplateOverlayMode}
                setOverlayTemplate={props.setOverlayTemplate}
                setActiveTab={props.setActiveTab}
              />
            );
          })}
        {activeTab === 'info' && (
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
