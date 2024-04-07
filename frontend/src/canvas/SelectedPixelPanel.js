import React from 'react';
import './SelectedPixelPanel.css';

const SelectedPixelPanel = props => {
  return (
    <div className="SelectedPixelPanel">
      <p className="SelectedPixelPanel__exit" onClick={() => props.clearPixelSelection()}>X</p>
      <p className="SelectedPixelPanel__item">Pos &nbsp; : ({props.selectedPositionX}, {props.selectedPositionY})</p>
      <p className="SelectedPixelPanel__item SelectedPixelPanel__address"  >Owner : 0xplaced_by</p>
    </div>
  );
}

export default SelectedPixelPanel;
