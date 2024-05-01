import React from 'react';
import './SelectedPixelPanel.css';
import '../../utils/Styles.css';

const SelectedPixelPanel = (props) => {
  return (
    <div className='SelectedPixelPanel'>
      <p
        className='Button__close SelectedPixelPanel__close'
        onClick={() => props.clearPixelSelection()}
      >
        X
      </p>
      <p className='Text__small SelectedPixelPanel__item'>
        Pos &nbsp; : ({props.selectedPositionX}, {props.selectedPositionY})
      </p>
      <p className='Text__small SelectedPixelPanel__address SelectedPixelPanel__item'>
        Owner : {props.pixelPlacedBy}
      </p>
    </div>
  );
};

export default SelectedPixelPanel;
