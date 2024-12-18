import React from 'react';
import { CSSTransition } from 'react-transition-group';
import './StencilItem.css';
import { fetchWrapper } from '../../services/apiService';
import FavoriteIcon from '../../resources/icons/Favorite.png';
import FavoritedIcon from '../../resources/icons/Favorited.png';
import Info from '../../resources/icons/Info.png';
import { devnetMode } from '../../utils/Consts.js';

const StencilItem = (props) => {
  console.log('stencil: ', props);

  const favoriteStencilCall = async (stencilId) => {
    if (devnetMode) return;
    if (!props.address || !props.canvasFactoryContract || !props.account)
      return;
    const favoriteCallData = props.canvasFactoryContract.populate(
      'favorite_stencil',
      {
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
      if (props.favorited) {
        await unfavoriteStencilCall(props.stencilId);
        props.updateFavorites(props.stencilId, props.favorites - 1, false);
      } else {
        await favoriteStencilCall(props.stencilId);
        props.updateFavorites(props.stencilId, props.favorites + 1, true);
      }
      return;
    }

    if (!props.favorited) {
      let favoriteResponse = await fetchWrapper('favorite-stencil-devnet', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          worldId: props.stencil.worldId.toString(),
          stencilId: props.stencilId.toString(),
          userAddress: props.queryAddress
        })
      });
      if (favoriteResponse.result) {
        props.updateFavorites(props.stencilId, props.favorites + 1, true);
      }
    } else {
      let unfavoriteResponse = await fetchWrapper('unfavorite-stencil-devnet', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          worldId: props.stencil.worldId.toString(),
          stencilId: props.stencilId.toString(),
          userAddress: props.queryAddress
        })
      });
      if (unfavoriteResponse.result) {
        props.updateFavorites(props.stencilId, props.favorites - 1, false);
      }
    }
  };

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
      image: props.image
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
                  className={`WorldItem__button ${
                    props.favorited ? 'Favorite__button--favorited' : ''
                  } ${props.queryAddress === '0' ? 'WorldItem__button--disabled' : ''}`}
                  onClick={handleFavoritePress}
                >
                  <img
                    className='Favorite__icon'
                    src={props.favorited ? FavoritedIcon : FavoriteIcon}
                    alt='Favorite'
                  />
                  <p className='Favorite__count'>{props.favorites}</p>
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
              {props.creatorText}
            </p>
          </div>
        </div>
      </CSSTransition>
    </div>
  );
};

export default StencilItem;
