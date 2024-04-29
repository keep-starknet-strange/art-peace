import React, { useCallback, useEffect } from 'react';
import './EventItem.css';
import canvasConfig from '../../configs/canvas.config.json';

const EventItem = (props) => {
  // TODO: Reward color
  // TODO: alt text for image
  const posx = props.template.position % canvasConfig.canvas.width;
  const posy = Math.floor(props.template.position / canvasConfig.canvas.width);

  const [formatedEnding, setFormatedEnding] = React.useState('');

  // Create changing gradient color backgroundColor
  const [color, setColor] = React.useState(0);
  const btrColorOffset = 1000;

  useEffect(() => {
    const interval = setInterval(() => {
      setColor((color + 3) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [color]);

  // Update the time every second
  const formatEnding = useCallback((time) => {
    const timeDiff = time - Date.now();
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const pad = (num) => (num < 10 ? '0' + num : num);
    return `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFormatedEnding(formatEnding(props.template.end_time));
    }, 1000);
    return () => clearInterval(interval);
  }, [formatEnding, props.template.end_time]);

  return (
    <div
      className='EventItem'
      style={{
        background: `linear-gradient(to bottom right, hsla(${color}, 100%, 50%, 30%), hsla(${(color + btrColorOffset) % 360}, 100%, 50%, 30%)`
      }}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={props.template.image}
          alt='nftimg'
          className='EventItem__image'
        />
        <div className='EventItem__desc'>
          <div className='EventItem__name'>
            <p>{props.template.name}</p>
          </div>
          <div className='EventItem__users'>
            <p>{props.template.users}</p>
          </div>
          <div className='EventItem__time'>
            <p>{formatedEnding}</p>
          </div>
        </div>
      </div>
      <div className='EventItem__info'>
        {props.template.reward !== undefined && (
          <div
            className='EventItem__info__item'
            style={{ backgroundColor: 'rgba(0, 0, 200, 0.2)' }}
          >
            <p>Reward</p>
            <p>
              {props.template.reward} {props.template.reward_token}
            </p>
          </div>
        )}
        <div
          className='EventItem__info__item'
          style={{ backgroundColor: 'rgba(200, 0, 0, 0.2)' }}
        >
          <p>Pos</p>
          <p>
            ({posx}, {posy})
          </p>
        </div>
        <div
          className='EventItem__info__item'
          style={{ backgroundColor: 'rgba(0, 200, 0, 0.2)' }}
        >
          <p>Size</p>
          <p>
            {props.template.width}x{props.template.height}
          </p>
        </div>
        {props.template.creator !== undefined && (
          <div
            className='EventItem__info__item'
            style={{ backgroundColor: 'rgba(200, 200, 0, 0.2)' }}
          >
            <p>Creator</p>
            <p>{props.template.creator}</p>
          </div>
        )}
      </div>
    </div>
  );
  // TODO: Handle unknown tokens
};

export default EventItem;
