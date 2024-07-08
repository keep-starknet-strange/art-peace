import React, { useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import './TemplateItem.css';
import canvasConfig from '../../configs/canvas.config.json';
import Info from '../../resources/icons/Info.png';
import { templateUrl } from '../../utils/Consts.js';

const TemplateItem = (props) => {
  const imageUrl = templateUrl + '/templates/';
  // TODO: Reward
  // TODO: alt text for image
  const posx = props.template.position % canvasConfig.canvas.width;
  const posy = Math.floor(props.template.position / canvasConfig.canvas.width);

  const selectTemplate = (e) => {
    if (
      e.target.classList.contains('TemplateItem__button') ||
      e.target.classList.contains('TemplateItem__button__text') ||
      e.target.classList.contains('TemplateItem__button__icon')
    ) {
      return;
    }
    let template = props.template;
    template.image = imageUrl + 'template-' + props.template.hash + '.png';
    props.setTemplateOverlayMode(true);
    props.setOverlayTemplate(template);
    props.setActiveTab('Canvas');
  };

  const [showInfo, setShowInfo] = useState(false);
  return (
    <div className='TemplateItem' onClick={selectTemplate}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <div className='TemplateItem__imagecontainer'>
          <img
            src={imageUrl + 'template-' + props.template.hash + '.png'}
            alt={`template-image-${props.template.id}`}
            className='TemplateItem__image'
          />
          <div className='TemplateItem__overlay'>
            <div className='TemplateItem__footer'>
              <div
                onClick={() => setShowInfo(!showInfo)}
                className='TemplateItem__button'
              >
                {showInfo ? (
                  <p
                    className='Text__xsmall TemplateItem__button__text'
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
                    className='TemplateItem__button__icon'
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CSSTransition
        in={showInfo}
        timeout={300}
        classNames='TemplateItem__info list-transition'
        unmountOnExit
        appear
      >
        <div className='TemplateItem__info Text__small'>
          <div
            className='TemplateItem__info__item'
            style={{ backgroundColor: 'rgba(255, 64, 61, 0.3)' }}
          >
            <p>Position</p>
            <p>
              ({posx},{posy})
            </p>
          </div>
          <div
            className='TemplateItem__info__item'
            style={{ backgroundColor: 'rgba(61, 255, 64, 0.3)' }}
          >
            <p>Size</p>
            <p>
              {props.template.width} x {props.template.height}
            </p>
          </div>
          {props.template.creator !== undefined && (
            <div
              className='TemplateItem__info__item'
              style={{ backgroundColor: 'rgba(64, 61, 255, 0.3)' }}
            >
              <p>Creator</p>
              <p>{props.template.creator}</p>
            </div>
          )}
        </div>
      </CSSTransition>
    </div>
  );
  // TODO: Handle unknown tokens
  // TODO: Creator info
};

export default TemplateItem;
