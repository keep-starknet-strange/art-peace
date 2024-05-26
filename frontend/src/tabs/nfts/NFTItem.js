import React, { useState } from 'react';
import './NFTItem.css';
import canvasConfig from '../../configs/canvas.config.json';
//To Do: Add alt text to images
const NFTItem = (props) => {
  const [likes, setLikes] = useState(props.likes);
  const [liked, setLiked] = useState(false);
  const handleLike = async () => {
    try {
      const response = await fetch('/like-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftkey: props.tokenId,
          useraddress: 'user_address_here', // Replace with actual user address
        }),
      });

      if (response.ok) {
        setLikes(likes + 1);
        setLiked(true);
      } else {
        console.error('Failed to like NFT');
      }
    } catch (error) {
      console.error('Error liking NFT:', error);
    }
  };

  const handleUnlike = async () => {
    try {
      const response = await fetch('/unlike-nft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nftkey: props.tokenId,
          useraddress: 'user_address_here', // Replace with actual user address
        }),
      });

      if (response.ok) {
        setLikes(likes - 1);
        setLiked(false);
      } else {
        console.error('Failed to unlike NFT');
      }
    } catch (error) {
      console.error('Error unliking NFT:', error);
    }
  };

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
          <p>{likes}</p>
          <button onClick={liked ? handleUnlike : handleLike}>
            {liked ? 'Unlike' : 'Like'}
          </button>
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