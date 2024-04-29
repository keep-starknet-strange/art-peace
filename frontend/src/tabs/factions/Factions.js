import React, { useState } from 'react';
import './Factions.css';
import FactionSelector from './FactionSelector.js';
import FactionItem from './FactionItem.js';
import ExpandableTab from '../ExpandableTab.js';

const FactionsMainSection = () => {
  // TODO: Add icons
  const myFactions = [
    {
      id: 1,
      name: 'Faction 1',
      icon: 'https://via.placeholder.com/50'
    },
    {
      id: 2,
      name: 'Faction 2',
      icon: 'https://via.placeholder.com/50'
    },
    {
      id: 3,
      name: 'Faction 3',
      icon: 'https://via.placeholder.com/50'
    },
    {
      id: 4,
      name: 'Faction 4',
      icon: 'https://via.placeholder.com/50'
    },
    {
      id: 5,
      name: 'Faction 5',
      icon: 'https://via.placeholder.com/50'
    }
  ];

  const [selectedFaction, setSelectedFaction] = useState(null);
  const clearFactionSelection = () => setSelectedFaction(null);

  return (
    <div className='Factions__main'>
      <div className='Factions__container'>
        {selectedFaction === null && (
          <div className='Factions__container__factions'>
            {myFactions.map((faction, idx) => (
              <FactionSelector
                key={idx}
                id={idx}
                factionId={faction.id}
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
    />
  );
};

export default Factions;
