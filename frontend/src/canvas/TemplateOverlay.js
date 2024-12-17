import React, { useEffect } from 'react';
import './TemplateOverlay.css';

const TemplateOverlay = (props) => {
  const [posx, setPosx] = React.useState(0);
  const [posy, setPosy] = React.useState(0);

  useEffect(() => {
    const x = props.overlayTemplate.position % 518;
    const y = Math.floor(props.overlayTemplate.position / 518);
    setPosx(x);
    setPosy(y);
  }, [props.overlayTemplate]);

  const [templateOutline, setTemplateOutline] = React.useState('none');
  useEffect(() => {
    const outlineWidth = 1;
    setTemplateOutline(`${outlineWidth}px solid rgba(200, 0, 0, 0.3)`);
  }, [props.overlayTemplate.image]);

  const closeOverlay = () => {
    props.setOverlayTemplate(null);
    props.setTemplateOverlayMode(false);
  };

  return (
    <div
      className='TemplateOverlay'
      style={{
        position: 'absolute',
        left: `${posx}px`,
        top: `${posy}px`,
        width: props.overlayTemplate.width,
        height: props.overlayTemplate.height,
        pointerEvents: 'none',
        display: 'block',
        outline: templateOutline
      }}
    >
      <div
        className='TemplateOverlay__image'
        style={{
          backgroundImage: `url(${props.overlayTemplate.image})`,
          width: '100%',
          height: '100%'
        }}
      ></div>
      <div
        className='TemplateOverlay__close Text__medium'
        onClick={closeOverlay}
      >
        X
      </div>
    </div>
  );
};

export default TemplateOverlay;
