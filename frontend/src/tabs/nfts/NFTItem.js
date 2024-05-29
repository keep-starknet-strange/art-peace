import React, { useEffect } from 'react';
import { CSSTransition } from 'react-transition-group';
import './NFTItem.css';
import { fetchWrapper } from '../../services/apiService';
import canvasConfig from '../../configs/canvas.config.json';
import ShareIcon from '../../resources/icons/Share.png';
import LikeIcon from '../../resources/icons/Like.png';
import LikedIcon from '../../resources/icons/Liked.png';

const NFTItem = (props) => {
  // TODO: alt text for image
  const posx = props.position % canvasConfig.canvas.width;
  const posy = Math.floor(props.position / canvasConfig.canvas.width);

  const [minterText, setMinterText] = React.useState('');
  // TODO: Load name from initial query instead of fetching it again
  useEffect(() => {
    async function fetchUsernameUrl() {
      const getUsernameUrl = `get-username?address=${props.minter}`;
      const result = await fetchWrapper(getUsernameUrl);
      if (result.data === null || result.data === '') {
        if (props.minter.length > 12) {
          setMinterText(
            minterText.substring(0, 4) +
              '...' +
              minterText.substring(minterText.length - 4, minterText.length)
          );
        } else {
          setMinterText(props.minter);
        }
      } else {
        if (result.data.length > 12) {
          setMinterText(result.data.substring(0, 7) + '...');
        } else {
          setMinterText(result.data);
        }
      }
    }
    if (props.minter) {
      fetchUsernameUrl();
    }
  }, [props.minter]);

  const [showInfo, setShowInfo] = React.useState(false);
  return (
    <div className='NFTItem'>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div className='NFTItem__imagecontainer'>
          <img
            src={props.image}
            alt={`nft-image-${props.tokenId}`}
            className='NFTItem__image'
          />
          <div className='NFTItem__overlay'>
            <div className='NFTItem__buttons'>
              <div className='NFTItem__button'>
                <img className='Share__icon' src={ShareIcon} alt='Share' />
              </div>
              <div
                className={`NFTItem__button ${props.liked ? 'Like__button--liked' : ''}`}
              >
                <img
                  className='Like__icon'
                  src={props.liked ? LikedIcon : LikeIcon}
                  alt='Like'
                />
                <p className='Like__count'>{props.likes}</p>
              </div>
              <div
                className='NFTItem__button'
                onClick={() => setShowInfo(!showInfo)}
              >
                <p
                  className='Text__xsmall'
                  style={{ margin: '0', padding: '0', width: '1rem' }}
                >
                  {showInfo ? 'X' : 'i'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CSSTransition
        in={showInfo}
        timeout={300}
        classNames='NFTItem__info list-transition'
        unmountOnExit
        appear
      >
        <div className='NFTItem__info Text__small'>
          <div
            className='NFTItem__info__item'
            style={{ backgroundColor: 'rgba(255, 64, 61, 0.3)' }}
          >
            <p>Position</p>
            <p>
              ({posx},{posy})
            </p>
          </div>
          <div
            className='NFTItem__info__item'
            style={{ backgroundColor: 'rgba(61, 255, 64, 0.3)' }}
          >
            <p>Size</p>
            <p>
              {props.width} x {props.height}
            </p>
          </div>
          <div
            className='NFTItem__info__item'
            style={{ backgroundColor: 'rgba(64, 61, 255, 0.3)' }}
          >
            <p>Minter</p>
            <p>{minterText}</p>
          </div>
        </div>
      </CSSTransition>
    </div>
  );
};

export default NFTItem;
