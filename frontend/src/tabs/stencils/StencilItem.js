import React, { useEffect, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import './StencilItem.css';
import { fetchWrapper } from '../../services/apiService';
import FavoriteIcon from '../../resources/icons/Favorite.png';
import FavoritedIcon from '../../resources/icons/Favorited.png';
import Info from '../../resources/icons/Info.png';
import { devnetMode } from '../../utils/Consts.js';

const StencilItem = (props) => {
  // TODO: Add creator text
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
    if (props.creator) {
      fetchUsernameUrl();
    }
  }, [props.creator]);

  const favoriteStencilCall = async (stencilId) => {
    if (devnetMode) return;
    if (!props.address || !props.canvasFactoryContract || !props.account)
      return;
    const favoriteCallData = props.canvasFactoryContract.populate(
      'favorite_stencil',
      {
        canvas_id: props.openedWorldId,
        stencil_id: stencilId
      }
    );
    const { suggestedMaxFee } = await props.estimateInvokeFee({
      contractAddress: props.canvasFactoryContract.address,
      entrypoint: 'favorite_stencil',
      calldata: favoriteCallData.calldata
    });
    /* global BigInt */
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await props.canvasFactoryContract.favorite_stencil(
      favoriteCallData.calldata,
      {
        maxFee
      }
    );
    console.log(result);
  };

  const unfavoriteStencilCall = async (stencilId) => {
    if (devnetMode) return;
    if (!props.address || !props.canvasFactoryContract || !props.account)
      return;
    const unfavoriteCallData = props.canvasFactoryContract.populate(
      'unfavorite_stencil',
      {
        canvas_id: props.openedWorldId,
        stencil_id: stencilId
      }
    );
    const { suggestedMaxFee } = await props.estimateInvokeFee({
      contractAddress: props.canvasFactoryContract.address,
      entrypoint: 'unfavorite_stencil',
      calldata: unfavoriteCallData.calldata
    });
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await props.canvasFactoryContract.unfavorite_stencil(
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
        await unfavoriteStencilCall(props.stencilId);
        props.updateFavorites(props.stencilId, favorites - 1, false);
      } else {
        await favoriteStencilCall(props.stencilId);
        const newFavoriteCount = favorites + 1;
        props.updateFavorites(props.stencilId, newFavoriteCount, true);

        // Check if this favorite is a milestone
        // switch (newFavoriteCount) {
        //   case 1:
        //   case 10:
        //   case 100:
        //   case 1000:
        //   case 10000:
        //   case 100000:
        //   case 1000000:
        //   case 10000000:
        //   case 100000000:
        //     await fetch(
        //       'http://localhost:3001/Art%20Peace%20Achievement%20Bot/message',
        //       {
        //         method: 'POST',
        //         headers: {
        //           'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify({
        //           userId: 'user',
        //           userName: 'User',
        //           text: `${props.userName} stencil just reached ${newFavoriteCount} favorites, view the stencil on art peace here https://art-peace.net/stencils/${props.stencilId}`
        //         })
        //       }
        //     ).catch((error) => console.error('Error notifying Eliza:', error));
        //     break;
        //   default:
        //     if (newFavoriteCount > 1000000000) {
        //       await fetch(
        //         'http://localhost:3001/Art%20Peace%20Achievement%20Bot/message',
        //         {
        //           method: 'POST',
        //           headers: {
        //             'Content-Type': 'application/json'
        //           },
        //           body: JSON.stringify({
        //             userId: 'user',
        //             userName: 'User',
        //             text: `${props.userName} stencil just reached ${newFavoriteCount} favorites, view the stencil on art peace here https://art-peace.net/stencils/${props.stencilId}`
        //           })
        //         }
        //       ).catch((error) =>
        //         console.error('Error notifying Eliza:', error)
        //       );
        //     }
        //     break;
        // }
      }
      return;
    }

    if (!favorited) {
      let favoriteResponse = await fetchWrapper('favorite-stencil-devnet', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          worldId: props.openedWorldId.toString(),
          stencilId: props.stencilId.toString()
        })
      });
      if (favoriteResponse.result) {
        const newFavoriteCount = favorites + 1;
        props.updateFavorites(props.stencilId, newFavoriteCount, true);
        // Check milestone in devnet mode as well
        // switch (newFavoriteCount) {
        //   case 1:
        //   case 10:
        //   case 100:
        //   case 1000:
        //   case 10000:
        //   case 100000:
        //   case 1000000:
        //   case 10000000:
        //   case 100000000:
        //     console.log(
        //       `🎉 Milestone reached! Stencil #${props.stencilId} just hit ${newFavoriteCount} favorites!`
        //     );
        //     await fetch(
        //       'http://localhost:3001/Art%20Peace%20Achievement%20Bot/message',
        //       {
        //         method: 'POST',
        //         headers: {
        //           'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify({
        //           userId: 'user',
        //           userName: 'User',
        //           text: `${props.userName} stencil just reached ${newFavoriteCount} favorites, view the stencil on art peace here https://art-peace.net/stencils/${props.stencilId}`
        //         })
        //       }
        //     ).catch((error) => console.error('Error notifying Eliza:', error));
        //     break;
        //   default:
        //     if (newFavoriteCount > 1000000000) {
        //       console.log(
        //         `🎉 Milestone reached! Stencil #${props.stencilId} just hit ${newFavoriteCount} favorites!`
        //       );
        //       await fetch(
        //         'http://localhost:3001/Art%20Peace%20Achievement%20Bot/message',
        //         {
        //           method: 'POST',
        //           headers: {
        //             'Content-Type': 'application/json'
        //           },
        //           body: JSON.stringify({
        //             userId: 'user',
        //             userName: 'User',
        //             text: `${props.userName} stencil just reached ${newFavoriteCount} favorites, view the stencil on art peace here https://art-peace.net/stencils/${props.stencilId}`
        //           })
        //         }
        //       ).catch((error) =>
        //         console.error('Error notifying Eliza:', error)
        //       );
        //     }
        //     break;
        // }
      }
    } else {
      let unfavoriteResponse = await fetchWrapper('unfavorite-stencil-devnet', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          worldId: props.openedWorldId.toString(),
          stencilId: props.stencilId.toString()
        })
      });
      if (unfavoriteResponse.result) {
        props.updateFavorites(props.stencilId, favorites - 1, false);
      }
    }
  };

  const [favorites, setFavorites] = useState(props.favorites);
  const [favorited, setFavorited] = useState(props.favorited);
  useEffect(() => {
    setFavorites(props.favorites);
    setFavorited(props.favorited);
  }, [props.favorites, props.favorited]);

  // TODO: Add share functionality
  /*
  function handleShare() {
    const worldLink = `${window.location.origin}/worlds/${props.stencilId}`;
    const twitterShareUrl = `https://x.com/intent/post?text=${encodeURIComponent('Gm. Join our forces! Draw on our art/peace World! @art_peace_sn 🗺️')}&url=${encodeURIComponent(worldLink)}`;
    window.open(twitterShareUrl, '_blank');
  }
                <div onClick={handleShare} className='WorldItem__button'>
                  <img className='Share__icon' src={ShareIcon} alt='Share' />
                </div>
  */

  const selectStencil = (e) => {
    if (
      e.target.classList.contains('Favorite__button--favorited') ||
      e.target.classList.contains('Favorite__count') ||
      e.target.classList.contains('Favorite__icon')
    ) {
      return;
    }
    let template = {
      templateId: props.stencilId,
      hash: props.hash,
      width: props.width,
      height: props.height,
      position: props.position,
      image: props.image,
      isStencil: true
    };
    props.setTemplateOverlayMode(true);
    props.setOverlayTemplate(template);
    props.setOpenedStencilId(props.stencilId);
    props.setActiveTab('Canvas');
  };

  const [showInfo, setShowInfo] = React.useState(false);
  return (
    <div
      className={`WorldItem ${props.activeStencilId === props.stencilId ? 'WorldItem--active' : ''}`}
      onClick={selectStencil}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div className='WorldItem__imagecontainer'>
          <img
            src={props.image}
            alt={`stencil-image-${props.stencilId}`}
            className='WorldItem__image'
          />
          <div className='WorldItem__overlay'>
            <div className='WorldItem__buttons'>
              <div></div>
              <div className='WorldItem__buttons2'>
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
            <p>Position</p>
            <p>
              {props.x}, {props.y}
            </p>
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

export default StencilItem;
