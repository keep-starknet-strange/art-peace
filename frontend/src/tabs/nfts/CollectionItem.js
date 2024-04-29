import React from 'react';
import './CollectionItem.css';
import canvasConfig from '../../configs/canvas.config.json';

const CollectionItem = (props) => {
  // TODO: alt text for image
  const posx = props.position % canvasConfig.canvas.width;
  const posy = Math.floor(props.position / canvasConfig.canvas.width);
  return (
    <div className='CollectionItem'>
      <div className='CollectionItem__imagecontainer'>
        <img
          src={props.image}
          alt={`nft-image-${props.tokenId}`}
          className='CollectionItem__image'
        />
      </div>
      <div className='CollectionItem__info'>
        <div
          className='CollectionItem__info__item'
          style={{ backgroundColor: 'rgba(200, 0, 0, 0.2)' }}
        >
          <p>Pos</p>
          <p>
            ({posx}, {posy})
          </p>
        </div>
        <div
          className='CollectionItem__info__item'
          style={{ backgroundColor: 'rgba(0, 200, 0, 0.2)' }}
        >
          <p>Size</p>
          <p>
            {props.width}x{props.height}
          </p>
        </div>
        <div
          className='CollectionItem__info__item'
          style={{ backgroundColor: 'rgba(0, 0, 200, 0.2)' }}
        >
          <p>Block</p>
          <p>{props.blockNumber}</p>
        </div>
      </div>
    </div>
  );
};

export default CollectionItem;
