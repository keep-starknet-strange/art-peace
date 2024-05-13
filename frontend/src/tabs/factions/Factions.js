import React, { useState } from 'react';
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
    <div className='Factions__main'>
      <div className='Factions__container'>
        {selectedFaction === null && (
          <div className='Factions__container__factions'>
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

const FactionsExpandedSection = () => {
  return (
    <div className='Factions__all'>
      <div className='Factions__header'>
        <h2 className='Factions__heading'>Explore Factions</h2>
      </div>
    </div>
  );
};

const Factions = (props) => {
  return (
    <ExpandableTab
      title='Factions'
      mainSection={FactionsMainSection}
      expandedSection={FactionsExpandedSection}
      setActiveTab={props.setActiveTab}
      userFactions={props.userFactions}
    />
  );
};

export default Factions;
