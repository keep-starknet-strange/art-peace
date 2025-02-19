import { useEffect, useState } from 'react';
import { playSoftClick2 } from '../utils/sounds';
import { backendUrl } from '../../api/api';

export const StencilCreationOverlay = (props: any) => {
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  useEffect(() => {
    setPosX(props.stencilPosition % props.canvasWidth + props.origin.x);
    setPosY(Math.floor(props.stencilPosition / props.canvasWidth) + props.origin.y);
  }, [props.stencilPosition, props.canvasWidth, props.origin]);

  useEffect(() => {
    const updateFromEvent = (event: any) => {
      if (
        !(
          event.target.classList.contains('Canva')
        )
      ) {
        return;
      }
      if (!props.stencilCreationSelected) {
        const canvasRef = props.getCanvasRef();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(
          ((event.clientX - rect.left) / (rect.right - rect.left)) * props.canvasWidth
        );
        const y = Math.floor(
          ((event.clientY - rect.top) / (rect.bottom - rect.top)) * props.canvasHeight
        );
        if (x < 0 || x >= props.canvasWidth || y < 0 || y >= props.canvasHeight) {
          return;
        }
        props.setStencilPosition(y * props.canvasWidth + x);
      }
    };
    if (!props.isCreationOverlay) return;
    if (props.stencilCreationMode && !props.stencilCreationSelected) {
      window.addEventListener('mousemove', updateFromEvent);
    }

    return () => {
      window.removeEventListener('mousemove', updateFromEvent);
    };
  }, [
    props.stencilCreationSelected,
    props.stencilCreationMode,
    props.canvasWidth,
    props.canvasHeight,
    props.worldId
  ]);

  useEffect(() => {
    const mouseUp = async (event: any) => {
      if (
        !(
          event.target.classList.contains('Canva')
        )
      ) {
        return;
      }

      if (props.stencilCreationSelected) {
        return;
      }
      if (event.button === 0 && props.stencilCreationMode) {
        const canvasRef = props.getCanvasRef();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(
          ((event.clientX - rect.left) / (rect.right - rect.left)) * props.canvasWidth
        );
        const y = Math.floor(
          ((event.clientY - rect.top) / (rect.bottom - rect.top)) * props.canvasHeight
        );
        if (x < 0 || x >= props.canvasWidth || y < 0 || y >= props.canvasHeight) {
          return;
        }
        props.setStencilPosition(y * props.canvasWidth + x);
        props.setStencilCreationSelected(true);
      }
    };
    if (!props.isCreationOverlay) return;
    window.addEventListener('mouseup', mouseUp);

    return () => {
      window.removeEventListener('mouseup', mouseUp);
    };
  }, [
    props.stencilCreationSelected,
    props.stencilCreationMode,
    props.canvasWidth,
    props.canvasHeight,
    props.worldId
  ]);

  const [stencilOutline, setStencilOutline] = useState('none');
  useEffect(() => {
    const outlineWidth = 1 * props.canvasScale;
    setStencilOutline(`${outlineWidth}px solid rgba(200, 0, 0, 0.3)`);
  }, [props.canvasScale]);

  return (
    <div
      className="absolute z-[9] bg-[rgba(0,0,0,0)]"
      style={{
        left: posX * props.canvasScale,
        top: posY * props.canvasScale,
        width: props.stencilImage.width * props.canvasScale,
        height: props.stencilImage.height * props.canvasScale,
        pointerEvents: 'none',
        display: 'block',
        outline: stencilOutline
      }}
    >
      <div
        className="bg-cover bg-no-repeat bg-center Pixel__img opacity-[0.4]"
        style={{
          backgroundImage: `url(${
            props.isCreationOverlay
            ? props.stencilImage.image
            : backendUrl + "/stencils/stencil-" + props.stencilImage.hash + ".png"
          })`,
          width: '100%',
          height: '100%'
        }}
      ></div>
      <div
        className="absolute z-[11] pointer-events-auto
        cursor-pointer bg-[rgba(255,255,255,0.8)] rounded-full shadow-lg flex flex-row justify-center align-center
        hover:shadow-xl hover:transform hover:scale-105 transition-transform transition-transform duration-150 ease-in-out text-center
        active:shadow-inner active:transform active:scale-100 transition-transform transition-transform duration-300 ease-in-out
        "
        style={{
          top: `calc(-1rem * ${props.canvasScale})`,
          left: `calc(100% - 0.5rem * ${props.canvasScale})`,
          width: `calc(0.8rem * ${props.canvasScale})`,
          height: `calc(0.8rem * ${props.canvasScale})`,
          fontSize: `calc(0.5rem * ${props.canvasScale})`,
          outline: `calc(0.05rem * ${props.canvasScale}) solid rgba(0,0,0,0.3)`
        }}
        onClick={() => {
          playSoftClick2();
          if (props.isCreationOverlay) {
            props.endStencilCreation();
          } else {
            props.setOpenedStencil(null);
          }
        }}
      >
        <p
          className="text-black"
          style={{
            // Shift the X to the center of the circle
            marginTop: `calc(0.02rem * ${props.canvasScale})`,
            marginLeft: `calc(0.07rem * ${props.canvasScale})`
          }}
        >
          X
        </p>
      </div>
    </div>
  );
};
