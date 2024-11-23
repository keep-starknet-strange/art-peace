import React, { useEffect, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import './WorldItem.css';
import { fetchWrapper } from '../../services/apiService';
import ShareIcon from '../../resources/icons/Share.png';
import FavoriteIcon from '../../resources/icons/Favorite.png';
import FavoritedIcon from '../../resources/icons/Favorited.png';
import Info from '../../resources/icons/Info.png';
import { devnetMode } from '../../utils/Consts.js';

const WorldItem = (props) => {
  const [creatorText, setCreatorText] = useState('');
  useEffect(() => {
    async function fetchUsernameUrl() {
      const getUsernameUrl = `get-username?address=${props.minter}`;
      const result = await fetchWrapper(getUsernameUrl);
      if (result.data === null || result.data === '') {
        if (props.host.length > 12) {
          setCreatorText(
            props.host.substring(0, 4) +
              '...' +
              props.host.substring(props.host.length - 4, props.host.length)
          );
        } else {
          setCreatorText(props.host);
        }
      } else {
        if (result.data.length > 11) {
          setCreatorText(result.data.substring(0, 8) + '...');
        } else {
          setCreatorText(result.data);
        }
      }
    }
    if (props.host) {
      fetchUsernameUrl();
    }
  }, [props.host]);
  const favoriteWorldCall = async (worldId) => {
    if (devnetMode) return;
    if (!props.address || !props.worldCanvasContract || !props.account) return;
    const favoriteCallData = props.worldCanvasContract.populate(
      'favorite_world',
      {
        world_id: worldId
      }
    );
    const { suggestedMaxFee } = await props.estimateInvokeFee({
      contractAddress: props.worldCanvasContract.address,
      entrypoint: 'favorite_world',
      calldata: favoriteCallData.calldata
    });
    /* global BigInt */
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await props.worldCanvasContract.favorite_world(
      favoriteCallData.calldata,
      {
        maxFee
      }
    );
    console.log(result);
  };

  const unfavoriteWorldCall = async (worldId) => {
    if (devnetMode) return;
    if (!props.address || !props.worldCanvasContract || !props.account) return;
    const unfavoriteCallData = props.worldCanvasContract.populate(
      'unfavorite_world',
      {
        world_id: worldId
      }
    );
    const { suggestedMaxFee } = await props.estimateInvokeFee({
      contractAddress: props.worldCanvasContract.address,
      entrypoint: 'unfavorite_world',
      calldata: unfavoriteCallData.calldata
    });
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await props.worldCanvasContract.unfavorite_world(
      unfavoriteCallData.calldata,
      {
        maxFee
      }
    );
    console.log(result);
  };

  const handleFavoritePress = async (event) => {
    if (props.queryAddress === '0') {
      return;
    }
    event.preventDefault();
    if (!devnetMode) {
      if (favorited) {
        await unfavoriteWorldCall(props.worldId);
        props.updateFavorites(props.worldId, favorites - 1, false);
      } else {
        await favoriteWorldCall(props.worldId);
        props.updateFavorites(props.worldId, favorites + 1, true);
      }
      return;
    }

    if (!favorited) {
      let favoriteResponse = await fetchWrapper('favorite-nft-devnet', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          worldId: props.worldId.toString()
        })
      });
      if (favoriteResponse.result) {
        props.updateFavorites(props.worldId, favorites + 1, true);
      }
    } else {
      let unfavoriteResponse = await fetchWrapper('unfavorite-nft-devnet', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          worldId: props.worldId.toString()
        })
      });
      if (unfavoriteResponse.result) {
        props.updateFavorites(props.worldId, favorites - 1, false);
      }
    }
  };

  const [favorites, setFavorites] = useState(props.favorites);
  const [favorited, setFavorited] = useState(props.favorited);
  useEffect(() => {
    setFavorites(props.favorites);
    setFavorited(props.favorited);
  }, [props.favorites, props.favorited]);

  function handleShare() {
    const twitterShareUrl = `https://x.com/intent/post?text=${encodeURIComponent('Come and draw on my art/peace World! @art_peace_sn')}&url=${encodeURIComponent(props.worldLink)}`;
    window.open(twitterShareUrl, '_blank');
  }

  const [timerText, setTimerText] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [endingSoon, setEndingSoon] = useState(false);
  useEffect(() => {
    const setupTimer = () => {
      let now = new Date().getTime();
      let endTime = new Date(props.endtime).getTime();
      let timeLeft = endTime - now;
      if (timeLeft > 0) {
        setIsLive(true);
        let hours = Math.floor(
          (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        let minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        if (hours > 10) {
          setEndingSoon(false);
          setTimerText('Live');
          return;
        } else {
          setEndingSoon(true);
          setTimerText(
            `${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
          );
        }
      } else {
        setEndingSoon(false);
        setIsLive(false);
        setTimerText('Ended');
      }
    };
    setupTimer();
    const interval = setInterval(setupTimer, 1000);
    return () => clearInterval(interval);
  }, [props.endtime]);

  const selectWorld = () => {
    props.setActiveWorldId(props.worldId);
  };

  const [showInfo, setShowInfo] = React.useState(false);
  return (
    <div
      className={`WorldItem ${props.activeWorldId === props.worldId ? 'WorldItem--active' : ''}`}
      onClick={selectWorld}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div className='WorldItem__imagecontainer'>
          <img
            src={props.image}
            alt={`world-image-${props.worldId}`}
            className='WorldItem__image'
          />
          <p className='Text__xsmall WorldItem__name'>{props.name}</p>
          <div className='WorldItem__overlay'>
            <div className='WorldItem__buttons'>
              <div
                className={`Buttonlike__primary WorldItem__buttonlike ${endingSoon ? 'WorldItem__buttonlike--endingsoon' : ''}`}
              >
                <div
                  style={{
                    width: '1rem',
                    height: '1rem',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 0, 0, 1)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative'
                  }}
                >
                  <div
                    className='WorldItem__live'
                    style={{
                      width: '1rem',
                      height: '1rem',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 0, 0, 1)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                    display={isLive ? 'block' : 'none'}
                  />
                </div>
                <p
                  className='Text__small'
                  style={{ margin: '0', padding: '3px 3px 3px 0.5rem' }}
                >
                  {timerText}
                </p>
              </div>
              <div className='WorldItem__buttons2'>
                <div
                  onClick={handleShare}
                  className='WorldItem__button'
                  style={{ display: 'none' }}
                >
                  <img className='Share__icon' src={ShareIcon} alt='Share' />
                </div>
                <div
                  className={`WorldItem__button ${favorited ? 'Favorite__button--favorited' : ''} ${props.queryAddress === '0' ? 'WorldItem__button--disabled' : ''}`}
                  onClick={handleFavoritePress}
                >
                  <img
                    className='Favorite__icon'
                    src={favorited ? FavoritedIcon : FavoriteIcon}
                    alt='Favorite'
                  />
                  <p className='Favorite__count'>{favorites}</p>
                </div>
                <div
                  onClick={() => setShowInfo(!showInfo)}
                  className='TemplateItem__button'
                >
                  {showInfo ? (
                    <p
                      className='Text__xsmall'
                      style={{ margin: '0', padding: '0' }}
                    >
                      X
                    </p>
                  ) : (
                    <img
                      src={Info}
                      alt='Info'
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                        borderRadius: '50%',
                        padding: '0.2rem',
                        width: '3rem',
                        height: '3rem'
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CSSTransition
        in={showInfo}
        timeout={300}
        classNames='WorldItem__info list-transition'
        unmountOnExit
        appear
      >
        <div className='WorldItem__info Text__small'>
          <div
            className='WorldItem__info__item'
            style={{ backgroundColor: 'rgba(61, 255, 64, 0.3)' }}
          >
            <p>Size</p>
            <p>
              {props.width} x {props.height}
            </p>
          </div>
          <div
            className='WorldItem__info__item'
            style={{ backgroundColor: 'rgba(255, 61, 64, 0.3)' }}
          >
            <p>Timer</p>
            <p>{props.timer}s</p>
          </div>
          <div
            className='WorldItem__info__item'
            style={{ backgroundColor: 'rgba(64, 61, 255, 0.3)' }}
          >
            <p>Creator</p>
            <p style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {creatorText}
            </p>
          </div>
        </div>
      </CSSTransition>
    </div>
  );
};

export default WorldItem;
