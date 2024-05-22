import React, { useState, useEffect } from 'react';
import './Factions.css';
import FactionSelector from './FactionSelector.js';
import FactionItem from './FactionItem.js';
import ExpandableTab from '../ExpandableTab.js';

const FactionsMainSection = (props) => {
  // TODO: Add icons
  const [selectedFaction, setSelectedFaction] = useState(null);
  const clearFactionSelection = () => setSelectedFaction(null);

  const [myFactions, setMyFactions] = useState([]);
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
      let newFaction = {
        factionId: faction.factionId,
        name: faction.name,
        icon: 'https://via.placeholder.com/50'
      };
      newFactions.push(newFaction);
    });
    setMyFactions(newFactions);
  }, [props.userFactions]);

  return (
    <div
      className='Factions__main'
      style={{ display: props.chainFaction === null ? 'none' : 'block' }}
    >
      <div className='Factions__container'>
        {selectedFaction === null && (
          <div className='Factions__container__factions'>
            <FactionSelector
              key={-1}
              id={-1}
              factionId={-1}
              name={props.chainFaction}
              icon='https://via.placeholder.com/50'
              setSelectedFaction={setSelectedFaction}
            />
            {myFactions.map((faction, idx) => (
              <FactionSelector
                key={idx}
                id={idx}
                factionId={faction.factionId}
                name={faction.name}
                icon={faction.icon}
                setSelectedFaction={setSelectedFaction}
              />
            ))}
          </div>
        )}
        {selectedFaction !== null && (
          <FactionItem
            factionId={selectedFaction}
            name={myFactions[selectedFaction].name}
            icon={myFactions[selectedFaction].icon}
            clearFactionSelection={clearFactionSelection}
          />
        )}
      </div>
    </div>
  );
};

const FactionsExpandedSection = (props) => {
  return (
    <div className='Factions__all'>
      {props.chainFaction === null ? (
        <div className='Factions__joiner'>
          <h3 className='Text__medium Heading__sub'>
            Join a Faction to represent your favorite chain
          </h3>
          <div className='Factions__joiner__container'>
            {props.chainOptions.map((chain, idx) => (
              <div
                key={idx}
                className='Factions__joiner__option'
                onClick={() => props.joinChain(idx)}
              >
                <img
                  className='Factions__joiner__option__icon'
                  src='https://via.placeholder.com/50'
                  alt='icon'
                />
                <h4 className='Text__medium Factions__joiner__option__text'>
                  {chain}
                </h4>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='Factions__header'>
          <h2 className='Factions__heading'>Explore Factions</h2>
        </div>
      )}
    </div>
  );
};

const Factions = (props) => {
  const [expanded, setExpanded] = useState(false);

  const [chainFaction, setChainFaction] = useState(null);
  const chainOptions = [
    'StarkNet',
    'Zksync',
    'Scroll',
    'Optimism',
    'Solana',
    'Avalanche',
    'Polygon',
    'Bitcoin'
  ];
  const joinChain = (chainId) => {
    setChainFaction(chainOptions[chainId]);
    setExpanded(false);
  };

  useEffect(() => {
    if (!chainFaction) {
      setExpanded(true);
    }
  }, [chainFaction]);

  return (
    <ExpandableTab
      title='Factions'
      mainSection={FactionsMainSection}
      expandedSection={FactionsExpandedSection}
      setActiveTab={props.setActiveTab}
      userFactions={props.userFactions}
      expanded={expanded}
      setExpanded={setExpanded}
      chainFaction={chainFaction}
      joinChain={joinChain}
      chainOptions={chainOptions}
      canExpand={chainFaction !== null}
    />
  );
};

export default Factions;
