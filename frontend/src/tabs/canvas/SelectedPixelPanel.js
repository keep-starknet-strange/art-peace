import React, { useEffect } from 'react';
import './SelectedPixelPanel.css';
import '../../utils/Styles.css';

const SelectedPixelPanel = (props) => {
  const [shortPixelPlacedBy, setShortPixelPlacedBy] = React.useState('');
  useEffect(() => {
    if (!props.pixelPlacedBy) {
      setShortPixelPlacedBy('');
      return;
    } else {
      if (props.pixelPlacedBy.length >= 64) {
        setShortPixelPlacedBy(
          `${props.pixelPlacedBy.slice(0, 6)}...${props.pixelPlacedBy.slice(-4)}`
        );
      } else {
        setShortPixelPlacedBy(props.pixelPlacedBy);
      }
    }
  }, [props.pixelPlacedBy]);
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
      {props.pixelPlacedBy && (
        <p className='Text__small SelectedPixelPanel__address SelectedPixelPanel__item'>
          Owner : {shortPixelPlacedBy}
        </p>
      )}
    </div>
  );
};

export default SelectedPixelPanel;
