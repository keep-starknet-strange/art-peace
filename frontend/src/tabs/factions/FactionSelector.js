import React from 'react';
import './FactionSelector.css';

const FactionSelector = (props) => {
  const selectFaction = () => {
    props.setSelectedFaction(props.id);
  };

  return (
    <div className='FactionSelector' onClick={selectFaction}>
      <div className='FactionSelector__icon'>
        <img src={props.icon} alt={props.name} />
      </div>
      <h2 className='Text__medium FactionSelector__name'>{props.name}</h2>
    </div>
  );
};

export default FactionSelector;
