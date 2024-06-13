import React, { useState, useEffect } from 'react';
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
import { PaginationView } from '../../ui/pagination.js';
import { getFactions } from '../../services/apiService.js';
import { convertUrl } from '../../utils/Consts.js';

const FactionsMainSection = (props) => {
  // TODO: convertUrl when fetching from server
  useState(() => {
    let newFactions = [];
    if (!props.userFactions) {
      return;
    }
    props.userFactions.forEach((faction) => {
      if (
        newFactions.findIndex((f) => f.factionId === faction.factionId) !== -1
      ) {
        return;
      }
      let totalAllocation = 0;
      props.factionPixelsData.forEach((factionData) => {
        if (factionData.factionId === faction.factionId) {
          totalAllocation += factionData.allocation;
        }
      });
      let newFaction = {
        factionId: faction.factionId,
        name: faction.name,
        icon: faction.icon,
        pixels: totalAllocation,
        members: faction.members,
        isMember: true,
        telegram: faction.telegram,
        twitter: faction.twitter,
        github: faction.github,
        site: faction.site
      };
      newFactions.push(newFaction);
    });
    props.setMyFactions(newFactions);
  }, [props.userFactions]);

  const joinFaction = (factionId) => {
    // TODO: Join faction
    let newFactions = [...props.allFactions];
    let idx = newFactions.findIndex((f) => f.factionId === factionId);
    if (idx === -1) {
      return;
    }
    newFactions[idx].isMember = true;

    let newMyFactions = [...props.myFactions];
    newMyFactions.push(newFactions[idx]);
    props.setMyFactions(newMyFactions);
    props.setAllFactions(newFactions);
  };

  return (
    <div
      className='Factions__main'
      style={{
        display:
          props.chainFaction === null && props.exploreMode === false
            ? 'none'
            : 'block'
      }}
    >
      <div className='Factions__container'>
        {props.selectedFaction === null && (
          <div className='Factions__container__factions'>
            {props.chainFaction && (
              <FactionSelector
                key={-1}
                id={-1}
                factionId={-1}
                name={props.chainFaction ? props.chainFaction.name : 'Chain'}
                icon={props.chainFaction ? props.chainFaction.icon : ''}
                selectFaction={props.selectFaction}
                pixels={1}
                members={1}
                isMember={true}
              />
            )}
            {props.myFactions.map((faction, idx) => (
              <FactionSelector
                key={idx}
                id={idx}
                factionId={faction.factionId}
                name={faction.name}
                icon={convertUrl(faction.icon)}
                selectFaction={props.selectFaction}
                pixels={faction.pixels}
                factionPixelsData={props.factionPixelsData}
                members={faction.members}
                isMember={faction.isMember}
                telegram={faction.telegram}
                twitter={faction.twitter}
                github={faction.github}
                site={faction.site}
              />
            ))}
            <p
              className='Text__medium'
              style={{
                display:
                  props.chainFaction || props.myFactions.length > 0
                    ? 'none'
                    : 'block',
                textAlign: 'center'
              }}
            >
              Join a faction to represent your community
            </p>
          </div>
        )}
        {props.selectedFaction !== null && (
          <FactionItem
            setActiveTab={props.setActiveTab}
            faction={props.selectedFaction}
            clearFactionSelection={props.clearFactionSelection}
            setTemplateOverlayMode={props.setTemplateOverlayMode}
            setOverlayTemplate={props.setOverlayTemplate}
            joinFaction={joinFaction}
          />
        )}
      </div>
    </div>
  );
};
// TODO: MyFactions pagination
// TODO: Pool

const FactionsExpandedSection = (props) => {
  // TODO: Load from server

  React.useEffect(() => {
    if (!props.expanded) {
      return;
    }
    async function getAllFactions() {
      try {
        const result = await getFactions({
          address: props.queryAddress,
          page: props.allFactionsPagination.page,
          pageLength: props.allFactionsPagination.pageLength
        });
        if (result.data) {
          if (props.allFactionsPagination.page === 1) {
            props.setAllFactions(result.data);
          } else {
            props.setAllFactions([...props.allFactions, ...result.data]);
          }
        }
      } catch (error) {
        console.log('Error fetching Nfts', error);
      }
    }
    getAllFactions();
  }, [
    props.queryAddress,
    props.expanded,
    props.allFactionsPagination.page,
    props.allFactionsPagination.pageLength
  ]);

  const exploreOptions = ['Factions', 'Events'];
  const [selectedExplore, setSelectedExplore] = useState(exploreOptions[0]);

  return (
    <div className='Factions__all'>
      {props.chainFaction === null && props.exploreMode === false ? (
        <div className='Factions__joiner'>
          <div className='Factions__joiner__header'>
            <h3 className='Text__medium Heading__sub Factions__joiner__heading'>
              Pick a faction to represent your favorite chain
            </h3>
            <div
              className='Text__medium Button__primary'
              onClick={() => props.setExploreMode(true)}
            >
              Explore
            </div>
          </div>
          <div className='Factions__joiner__container'>
            {props.chainOptions.map((chain, idx) => (
              <div
                key={idx}
                className='Factions__joiner__option__container'
                onClick={() => props.joinChain(idx)}
              >
                <div className='Factions__joiner__option__inner'>
                  <img
                    className='Factions__joiner__option__icon'
                    src={chain.icon}
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
          </div>
          <div className='Factions__all__container'>
            {props.allFactions.map((faction, idx) => (
              <FactionSelector
                key={idx}
                id={idx}
                factionId={faction.factionId}
                name={faction.name}
                icon={convertUrl(faction.icon)}
                selectFaction={props.selectFaction}
                pixels={faction.pixels}
                members={faction.members}
                isMember={faction.isMember}
                telegram={faction.telegram}
                twitter={faction.twitter}
                github={faction.github}
                site={faction.site}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Factions = (props) => {
  const [expanded, setExpanded] = useState(false);
  const [exploreMode, setExploreMode] = useState(false);
  const [myFactions, setMyFactions] = useState([]);
  const [allFactions, setAllFactions] = useState([]);

  const chainOptions = [
    { name: 'Starknet', icon: Starknet },
    { name: 'Solana', icon: Solana },
    { name: 'Bitcoin', icon: Bitcoin },
    { name: 'Base', icon: Base },
    { name: 'ZkSync', icon: ZkSync },
    { name: 'Polygon', icon: Polygon },
    { name: 'Optimism', icon: Optimism },
    { name: 'Scroll', icon: Scroll }
  ];
  const joinChain = (chainId) => {
    props.setChainFaction(chainOptions[chainId]);
    setExpanded(false);
  };

  useEffect(() => {
    if (!props.chainFaction) {
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
  const selectFaction = (factionId) => {
    // TODO: Make this more efficient
    for (let i = 0; i < myFactions.length; i++) {
      if (myFactions[i].factionId === factionId) {
        setSelectedFaction(myFactions[i]);
        return;
      }
    }

    for (let i = 0; i < allFactions.length; i++) {
      if (allFactions[i].factionId === factionId) {
        setSelectedFaction(allFactions[i]);
        return;
      }
    }
  };

  const clearFactionSelection = () => {
    setSelectedFaction(null);
  };

  return (
    <ExpandableTab
      title='Factions'
      mainSection={FactionsMainSection}
      expandedSection={FactionsExpandedSection}
      setActiveTab={props.setActiveTab}
      userFactions={props.userFactions}
      factionPixels={props.factionPixels}
      factionPixelsData={props.factionPixelsData}
      expanded={expanded}
      setExpanded={setExpanded}
      exploreMode={exploreMode}
      setExploreMode={setExploreMode}
      chainFaction={props.chainFaction}
      joinChain={joinChain}
      chainOptions={chainOptions}
      canExpand={props.chainFaction !== null || exploreMode}
      myFactions={myFactions}
      setMyFactions={setMyFactions}
      myFactionsPagination={myFactionsPagination}
      setMyFactionsPagination={setMyFactionsPagination}
      allFactionsPagination={allFactionsPagination}
      setAllFactionsPagination={setAllFactionsPagination}
      allFactions={allFactions}
      setAllFactions={setAllFactions}
      selectedFaction={selectedFaction}
      selectFaction={selectFaction}
      clearFactionSelection={clearFactionSelection}
      setTemplateOverlayMode={props.setTemplateOverlayMode}
      setOverlayTemplate={props.setOverlayTemplate}
      isMobile={props.isMobile}
    />
  );
};

export default Factions;
