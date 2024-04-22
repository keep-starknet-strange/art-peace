import React from 'react'
import './TemplateItem.css';
import canvasConfig from "../../configs/canvas.config.json"

const TemplateItem = props => {
  // TODO: Reward color
  // TODO: alt text for image
  // TODO: Follow button in top right of image
  const posx = props.template.position % canvasConfig.canvas.width;
  const posy = Math.floor(props.template.position / canvasConfig.canvas.width);
  return (
    <div className="TemplateItem">
      <div style={{position: 'relative'}}>
        <img src={props.template.image} alt="nftimg" className="TemplateItem__image" />
        <div className="TemplateItem__desc">
          <div className="TemplateItem__name">
            <p>{props.template.name}</p>
          </div>
          <div className="TemplateItem__users">
            <p>{props.template.users}</p>
          </div>
          <div className="TemplateItem__like">
            <p>{props.template.likes}</p>
          </div>
        </div>
      </div>
      <div className="TemplateItem__info">
        { props.template.reward !== undefined &&
        <div className="TemplateItem__info__item" style={{backgroundColor: 'rgba(0, 0, 200, 0.2)'}}>
          <p>Reward</p>
          <p>{props.template.reward} {props.template.reward_token}</p>
        </div>
        }
        <div className="TemplateItem__info__item" style={{backgroundColor: 'rgba(200, 0, 0, 0.2)'}}>
          <p>Pos</p>
          <p>({posx}, {posy})</p>
        </div>
        <div className="TemplateItem__info__item" style={{backgroundColor: 'rgba(0, 200, 0, 0.2)'}}>
          <p>Size</p>
          <p>{props.template.width}x{props.template.height}</p>
        </div>
        { props.template.creator !== undefined &&
        <div className="TemplateItem__info__item" style={{backgroundColor: 'rgba(200, 200, 0, 0.2)'}}>
          <p>Creator</p>
          <p>{props.template.creator}</p>
        </div>
        }
      </div>
    </div>
  );
  // TODO: Handle unknown tokens
}

export default TemplateItem;
