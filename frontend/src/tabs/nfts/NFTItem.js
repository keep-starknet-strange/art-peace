import React from 'react';
import './NFTItem.css';
import canvasConfig from '../../configs/canvas.config.json';

const NFTItem = (props) => {
  // TODO: alt text for image
  const posx = props.position % canvasConfig.canvas.width;
  const posy = Math.floor(props.position / canvasConfig.canvas.width);
  return (
    <div className='NFTItem'>
      <div style={{ position: 'relative' }}>
        <div className='NFTItem__imagecontainer'>
          <img
            src={props.image}
            alt={`nft-image-${props.tokenId}`}
            className='NFTItem__image'
          />
        </div>
        <div className='NFTItem__like'>
          <p>{props.likes}</p>
        </div>
      </div>
      <div className='NFTItem__info'>
        <div
          className='NFTItem__info__item'
          style={{ backgroundColor: 'rgba(200, 0, 0, 0.2)' }}
        >
          <p>Pos</p>
          <p>
            ({posx}, {posy})
          </p>
        </div>
        <div
          className='NFTItem__info__item'
          style={{ backgroundColor: 'rgba(0, 200, 0, 0.2)' }}
        >
          <p>Size</p>
          <p>
            {props.width}x{props.height}
          </p>
        </div>
        <div
          className='NFTItem__info__item'
          style={{ backgroundColor: 'rgba(0, 0, 200, 0.2)' }}
        >
          <p>Block</p>
          <p>{props.blockNumber}</p>
        </div>
        <div
          className='NFTItem__info__item'
          style={{ backgroundColor: 'rgba(200, 200, 0, 0.2)' }}
        >
          <p>Minter</p>
          <p
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '12rem'
            }}
          >
            {props.minter}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NFTItem;
