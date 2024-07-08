import React, { useState, useEffect } from 'react';
import { useContractWrite } from '@starknet-react/core';
import './Factions.css';
import FactionSelector from './FactionSelector.js';
import FactionItem from './FactionItem.js';
import ExpandableTab from '../ExpandableTab.js';
import Base from '../../resources/chains/Base.png';
import Optimism from '../../resources/chains/Optimism.png';
import Scroll from '../../resources/chains/Scroll.png';
import Starknet from '../../resources/chains/Starknet.png';
import Bitcoin from '../../resources/chains/Bitcoin.png';
import Polygon from '../../resources/chains/Polygon.png';
import Solana from '../../resources/chains/Solana.png';
import ZkSync from '../../resources/chains/ZkSync.png';
import Arbitrum from '../../resources/chains/Arbitrum.png';
import Dogecoin from '../../resources/chains/Dogecoin.png';
import { PaginationView } from '../../ui/pagination.js';
import { getFactions, getChainFactions } from '../../services/apiService.js';
import { devnetMode, convertUrl } from '../../utils/Consts.js';
import { fetchWrapper } from '../../services/apiService.js';

const FactionsMainSection = (props) => {
  // TODO: convertUrl when fetching from server
  return (
    <div
      className='Factions__main'
      style={{
        display:
          props.queryAddress !== '0' &&
          props.chainFaction === null &&
          props.exploreMode === false
            ? 'none'
            : 'block'
      }}
    >
      <div className='Factions__container'>
        {props.selectedFaction === null && (
          <div className='Factions__container__factions'>
            <div className='Factions__header'>
              <h2 className='Text__large Factions__heading'>My Factions</h2>
              {!props.expanded && (
                <div
                  className='Text__small Button__primary'
                  onClick={() => {
                    props.setExpanded(true);
                    props.setExploreMode(true);
                  }}
                >
                  Explore
                </div>
              )}
            </div>
            {props.chainFaction && (
              <FactionSelector
                key={-1}
                id={-1}
                factionId={
                  props.chainFaction ? props.chainFaction.factionId : -1
                }
                name={props.chainFaction ? props.chainFaction.name : 'Chain'}
                leader={null}
                joinable={
                  props.chainFaction ? props.chainFaction.joinable : true
                }
                icon={
                  props.chainFaction ? chainIcons[props.chainFaction.name] : ''
                }
                selectFaction={props.selectFaction}
                pixels={props.chainFaction ? 2 : 0}
                members={props.chainFaction ? props.chainFaction.members : 0}
                isMember={true}
                telegram={props.chainFaction ? props.chainFaction.telegram : ''}
                twitter={props.chainFaction ? props.chainFaction.twitter : ''}
                github={props.chainFaction ? props.chainFaction.github : ''}
                site={props.chainFaction ? props.chainFaction.site : ''}
                isChain={true}
                userInChainFaction={props.chainFaction !== null}
                userInFaction={props.userFactions.length > 0}
                queryAddress={props.queryAddress}
                setModal={props.setModal}
              />
            )}
            {props.userFactions.map((faction, idx) => (
              <FactionSelector
                key={idx}
                id={idx}
                factionId={faction.factionId}
                name={faction.name}
                leader={faction.leader}
                joinable={faction.joinable}
                icon={convertUrl(faction.icon)}
                selectFaction={props.selectFaction}
                pixels={faction.allocation}
                factionPixelsData={props.factionPixelsData}
                members={faction.members}
                isMember={faction.isMember}
                telegram={faction.telegram}
                twitter={faction.twitter}
                github={faction.github}
                site={faction.site}
                isChain={false}
                userInChainFaction={props.chainFaction !== null}
                userInFaction={props.userFactions.length > 0}
                queryAddress={props.queryAddress}
                setModal={props.setModal}
              />
            ))}
            <p
              className='Text__medium'
              style={{
                display:
                  props.chainFaction || props.userFactions.length > 0
                    ? 'none'
                    : 'block',
                textAlign: 'center'
              }}
            >
              {props.queryAddress === '0'
                ? 'Login with your wallet to see your factions'
                : 'Join a faction to represent your community and receive extra pixels'}
            </p>
            {props.userFactions.length === 0 && props.chainFaction !== null && (
              <div
                className='Text__medium Button__primary Factions__msg__button'
                onClick={() => props.setExpanded(true)}
              >
                Join a community faction
              </div>
            )}
          </div>
        )}
        {props.selectedFaction !== null && (
          <FactionItem
            address={props.address}
            queryAddress={props.queryAddress}
            colors={props.colors}
            setActiveTab={props.setActiveTab}
            faction={props.selectedFaction}
            clearFactionSelection={props.clearFactionSelection}
            setTemplateOverlayMode={props.setTemplateOverlayMode}
            setOverlayTemplate={props.setOverlayTemplate}
            setTemplateFaction={props.setTemplateFaction}
            setTemplateCreationMode={props.setTemplateCreationMode}
            setTemplateCreationSelected={props.setTemplateCreationSelected}
            setTemplateImage={props.setTemplateImage}
            setTemplateColorIds={props.setTemplateColorIds}
            joinFaction={props.joinFaction}
            joinChain={props.joinChain}
            userInFaction={props.userFactions.length > 0}
            userInChainFaction={props.chainFaction !== null}
            factionAlloc={props.selectedFactionType === 'chain' ? 2 : 1}
            isChain={props.selectedFactionType === 'chain'}
            gameEnded={props.gameEnded}
            host={props.host}
            setModal={props.setModal}
          />
        )}
      </div>
    </div>
  );
};
// TODO: MyFactions pagination

const FactionsExpandedSection = (props) => {
  React.useEffect(() => {
    if (!props.expanded) {
      return;
    }
    async function getAllFactions() {
      try {
        const result = await getFactions({
          queryAddress: props.queryAddress,
          page: props.allFactionsPagination.page,
          pageLength: props.allFactionsPagination.pageLength
        });
        if (result.data) {
          if (props.allFactionsPagination.page === 1) {
            let factions = result.data;
            // Remove non-joinable factions
            factions = factions.filter((faction) => faction.joinable);
            // Randomize factions order
            factions.sort(() => Math.random() - 0.5);
            props.setAllFactions(factions);
          } else {
            let factions = [...props.allFactions, ...result.data];
            // Remove non-joinable factions
            factions = factions.filter((faction) => faction.joinable);
            // Randomize factions order
            factions.sort(() => Math.random() - 0.5);
            props.setAllFactions(factions);
          }
        }
      } catch (error) {
        console.log('Error fetching Nfts', error);
      }
    }
    async function getAllChainFactions() {
      try {
        const result = await getChainFactions({
          queryAddress: props.queryAddress
        });
        if (result.data) {
          let chainFactions = result.data;
          // Randomize chain factions order
          chainFactions.sort(() => Math.random() - 0.5);
          props.setChainFactions(chainFactions);
        }
      } catch (error) {
        console.log('Error fetching Nfts', error);
      }
    }
    getAllFactions();
    getAllChainFactions();
  }, [
    props.queryAddress,
    props.expanded,
    props.allFactionsPagination.page,
    props.allFactionsPagination.pageLength
  ]);

  const exploreOptions = ['Factions']; //, 'Events'];
  const [selectedExplore, setSelectedExplore] = useState(exploreOptions[0]);

  return (
    <div className='Factions__all'>
      {props.chainFaction === null &&
      props.exploreMode === false &&
      !props.gameEnded ? (
        <div className='Factions__joiner'>
          <div className='Factions__joiner__header'>
            <h3 className='Text__medium Heading__sub Factions__joiner__heading'>
              Join a chain faction and earn extra pixels
            </h3>
            <div
              className='Text__medium Button__primary'
              onClick={() => props.setExploreMode(true)}
            >
              Explore
            </div>
          </div>
          <div className='Factions__joiner__container'>
            {props.chainFactions.map((chain, idx) => (
              <div
                key={idx}
                className='Factions__joiner__option__container'
                onClick={() => {
                  props.setModal({
                    title: 'Join Chain Faction',
                    text: `You can only join one Chain Faction. Are you sure you want to join the ${chain.name} Faction?`,
                    confirm: 'Join',
                    action: () => props.joinChain(chain.factionId)
                  });
                }}
              >
                <div className='Factions__joiner__option__inner'>
                  <img
                    className='Factions__joiner__option__icon'
                    src={chainIcons[chain.name]}
                    alt='icon'
                  />
                  <h4 className='Text__large Factions__joiner__option__text'>
                    {chain.name}
                  </h4>
                </div>
              </div>
            ))}
            <PaginationView
              data={props.allFactions}
              stateValue={props.allFactionsPagination}
              setState={props.setAllFactionsPagination}
            />
          </div>
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div className='Factions__header'>
            <h2 className='Text__large Factions__heading'>Explore</h2>
            {false && (
              <div className='Factions__header__buttons'>
                {exploreOptions.map((option, idx) => (
                  <div
                    key={idx}
                    className={`Text__medium Button__primary Factions__header__button ${
                      selectedExplore === option
                        ? 'Factions__header__button--selected'
                        : ''
                    }`}
                    onClick={() => setSelectedExplore(option)}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className='Factions__all__container'>
            {props.userFactions.length === 0 && (
              <p className='Text__medium Factions__all__msg'>
                Join a community faction and gain extra pixels
              </p>
            )}
            <div className='Factions__all__grid'>
              {props.allFactions.map((faction, idx) => (
                <FactionSelector
                  key={idx}
                  id={idx}
                  factionId={faction.factionId}
                  name={faction.name}
                  leader={faction.leader}
                  joinable={faction.joinable}
                  icon={convertUrl(faction.icon)}
                  selectFaction={props.selectFaction}
                  pixels={faction.pixels}
                  members={faction.members}
                  isMember={faction.isMember}
                  telegram={faction.telegram}
                  twitter={faction.twitter}
                  github={faction.github}
                  site={faction.site}
                  isChain={false}
                  userInChainFaction={props.chainFaction !== null}
                  userInFaction={props.userFactions.length > 0}
                  joinFaction={props.joinFaction}
                  joinChain={props.joinChain}
                  queryAddress={props.queryAddress}
                  setModal={props.setModal}
                />
              ))}
            </div>
            <h2 className='Text__large Factions__heading'>Chain Factions</h2>
            <div className='Factions__all__grid'>
              {props.chainFactions.map((chain, idx) => (
                <FactionSelector
                  key={idx}
                  id={idx}
                  factionId={chain.factionId}
                  name={chain.name}
                  leader={null}
                  joinable={chain.joinable}
                  icon={chainIcons[chain.name]}
                  selectFaction={props.selectFaction}
                  pixels={chain.pixels}
                  members={chain.members}
                  isMember={chain.isMember}
                  telegram={chain.telegram}
                  twitter={chain.twitter}
                  github={chain.github}
                  site={chain.site}
                  isChain={true}
                  userInChainFaction={props.chainFaction !== null}
                  userInFaction={props.userFactions.length > 0}
                  joinFaction={props.joinFaction}
                  joinChain={props.joinChain}
                  queryAddress={props.queryAddress}
                  setModal={props.setModal}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const chainIcons = {
  Starknet: Starknet,
  Solana: Solana,
  Bitcoin: Bitcoin,
  Base: Base,
  ZkSync: ZkSync,
  Polygon: Polygon,
  Optimism: Optimism,
  Scroll: Scroll,
  Arbitrum: Arbitrum,
  Dogecoin: Dogecoin
};

const Factions = (props) => {
  const [expanded, setExpanded] = useState(false);
  const [exploreMode, setExploreMode] = useState(false);
  const [chainFactions, setChainFactions] = useState([]);
  const [allFactions, setAllFactions] = useState([]);

  const [calls, setCalls] = useState([]);
  const joinChainCall = (chainId) => {
    if (props.gameEnded) return;
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract) return;
    if (chainId === 0) return;
    setCalls(
      props.artPeaceContract.populateTransaction['join_chain_faction'](chainId)
    );
  };
  const joinFactionCall = (factionId) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract) return;
    if (factionId === 0) return;
    setCalls(
      props.artPeaceContract.populateTransaction['join_faction'](factionId)
    );
  };

  useEffect(() => {
    const factionCall = async () => {
      if (devnetMode) return;
      if (calls.length === 0) return;
      await writeAsync();
      console.log('Faction call successful:', data, isPending);
    };
    factionCall();
  }, [calls]);

  const { writeAsync, data, isPending } = useContractWrite({
    calls
  });

  const joinChain = async (chainId) => {
    if (!devnetMode) {
      joinChainCall(chainId);
      setExpanded(false);
      let newChainFactions = chainFactions.map((chain) => {
        if (chain.factionId === chainId) {
          chain.isMember = true;
          chain.members += 1;
        }
        return chain;
      });
      let chain = chainFactions.find((chain) => chain.factionId === chainId);
      if (chain) {
        props.setChainFaction(chain);
        let newChainFactionPixelsData = {
          allocation: 2,
          factionId: chainId,
          lastPlacedTime: new Date(0).getTime(),
          memberPixels: 0
        };
        props.setChainFactionPixelsData([newChainFactionPixelsData]);
      }
      setChainFactions(newChainFactions);
      return;
    }
    let joinChainResponse = await fetchWrapper('join-chain-faction-devnet', {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        chainId: chainId.toString()
      })
    });
    if (joinChainResponse.result) {
      setExpanded(false);
      let newChainFactions = chainFactions.map((chain) => {
        if (chain.factionId === chainId) {
          chain.isMember = true;
          chain.members += 1;
        }
        return chain;
      });
      let chain = chainFactions.find((chain) => chain.factionId === chainId);
      if (chain) {
        props.setChainFaction(chain);
        let newChainFactionPixelsData = {
          allocation: 2,
          factionId: chainId,
          lastPlacedTime: new Date(0).getTime(),
          memberPixels: 0
        };
        props.setChainFactionPixelsData([newChainFactionPixelsData]);
      }
      setChainFactions(newChainFactions);
    }
  };

  const joinFaction = async (factionId) => {
    if (!devnetMode) {
      joinFactionCall(factionId);
      let newAllFactions = allFactions.map((faction) => {
        if (faction.factionId === factionId) {
          faction.isMember = true;
          faction.members += 1;
        }
        return faction;
      });
      let faction = allFactions.find(
        (faction) => faction.factionId === factionId
      );
      let newUserFactions = [...props.userFactions, faction];
      props.setUserFactions(newUserFactions);
      // TODO: Hardcoded
      let newFactionPixelsData = {
        allocation: 1,
        factionId: factionId,
        lastPlacedTime: new Date(0).getTime(),
        memberPixels: 0
      };
      props.setFactionPixelsData([newFactionPixelsData]);
      setAllFactions(newAllFactions);
      return;
    }
    let joinFactionResponse = await fetchWrapper('join-faction-devnet', {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        factionId: factionId.toString()
      })
    });
    if (joinFactionResponse.result) {
      let newAllFactions = allFactions.map((faction) => {
        if (faction.factionId === factionId) {
          faction.isMember = true;
          faction.members += 1;
        }
        return faction;
      });
      let faction = allFactions.find(
        (faction) => faction.factionId === factionId
      );
      let newUserFactions = [...props.userFactions, faction];
      props.setUserFactions(newUserFactions);
      let newFactionPixelsData = {
        allocation: 1,
        factionId: factionId,
        lastPlacedTime: new Date(0).getTime(),
        memberPixels: 0
      };
      props.setFactionPixelsData([newFactionPixelsData]);
      setAllFactions(newAllFactions);
    }
  };

  useEffect(() => {
    if (props.queryAddress !== '0' && !props.chainFaction) {
      setExpanded(true);
    }
  }, [props.chainFaction]);

  const [myFactionsPagination, setMyFactionsPagination] = useState({
    pageLength: 6,
    page: 1
  });
  const [allFactionsPagination, setAllFactionsPagination] = useState({
    pageLength: 15,
    page: 1
  });

  const [selectedFaction, setSelectedFaction] = useState(null);
  const [selectedFactionType, setSelectedFactionType] = useState(null);
  const selectFaction = (faction, isChain) => {
    setSelectedFaction(faction);
    setSelectedFactionType(isChain ? 'chain' : 'faction');
  };

  const clearFactionSelection = () => {
    setSelectedFaction(null);
  };

  return (
    <ExpandableTab
      title='Factions'
      mainSection={FactionsMainSection}
      expandedSection={FactionsExpandedSection}
      address={props.address}
      artPeaceContract={props.artPeaceContract}
      setActiveTab={props.setActiveTab}
      userFactions={props.userFactions}
      setUserFactions={props.setUserFactions}
      chainFactionPixels={props.chainFactionPixels}
      factionPixels={props.factionPixels}
      chainFactionPixelsData={props.chainFactionPixelsData}
      setChainFactionPixelsData={props.setChainFactionPixelsData}
      factionPixelsData={props.factionPixelsData}
      setFactionPixelsData={props.setFactionPixelsData}
      expanded={expanded}
      setExpanded={setExpanded}
      exploreMode={exploreMode}
      setExploreMode={setExploreMode}
      chainFaction={props.chainFaction}
      joinChain={joinChain}
      joinFaction={joinFaction}
      chainFactions={chainFactions}
      setChainFactions={setChainFactions}
      queryAddress={props.queryAddress}
      canExpand={
        (props.queryAddress !== '0' && props.chainFaction !== null) ||
        exploreMode
      }
      myFactionsPagination={myFactionsPagination}
      setMyFactionsPagination={setMyFactionsPagination}
      allFactionsPagination={allFactionsPagination}
      setAllFactionsPagination={setAllFactionsPagination}
      allFactions={allFactions}
      setAllFactions={setAllFactions}
      selectedFaction={selectedFaction}
      selectedFactionType={selectedFactionType}
      selectFaction={selectFaction}
      clearFactionSelection={clearFactionSelection}
      setTemplateOverlayMode={props.setTemplateOverlayMode}
      setOverlayTemplate={props.setOverlayTemplate}
      isMobile={props.isMobile}
      gameEnded={props.gameEnded}
      host={props.host}
      colors={props.colors}
      setTemplateFaction={props.setTemplateFaction}
      setTemplateCreationMode={props.setTemplateCreationMode}
      setTemplateCreationSelected={props.setTemplateCreationSelected}
      setTemplateImage={props.setTemplateImage}
      setTemplateColorIds={props.setTemplateColorIds}
      setModal={props.setModal}
    />
  );
};

export default Factions;
