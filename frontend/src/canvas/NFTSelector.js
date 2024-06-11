import React, { useState, useEffect } from 'react';
import './NFTSelector.css';

const NFTSelector = (props) => {
  const [nftSelectionInitX, setNftSelectionInitX] = useState(0);
  const [nftSelectionInitY, setNftSelectionInitY] = useState(0);
  const [nftSelectionStartX, setNftSelectionStartX] = useState(0);
  const [nftSelectionStartY, setNftSelectionStartY] = useState(0);
  const [nftSelectionWidth, setNftSelectionWidth] = useState(0);
  const [nftSelectionHeight, setNftSelectionHeight] = useState(0);

  useEffect(() => {
    const updateFromEvent = (event) => {
      if (
        !(
          event.target.classList.contains('ExtraPixelsCanvas') ||
          event.target.classList.contains('Canvas')
        )
      ) {
        return;
      }
      if (!props.nftSelectionStarted) {
        // TODO: To function
        const canvas = props.canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(
          ((event.clientX - rect.left) / (rect.right - rect.left)) * props.width
        );
        const y = Math.floor(
          ((event.clientY - rect.top) / (rect.bottom - rect.top)) * props.height
        );
        if (x < 0 || x >= props.width || y < 0 || y >= props.height) {
          return;
        }
        setNftSelectionStartX(x);
        setNftSelectionStartY(y);
        setNftSelectionWidth(1);
        setNftSelectionHeight(1);
        props.setNftPosition(x + y * props.width);
        props.setNftWidth(1);
        props.setNftHeight(1);
        return;
      } else {
        const canvas = props.canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor(
          ((event.clientX - rect.left) / (rect.right - rect.left)) * props.width
        );
        const y = Math.floor(
          ((event.clientY - rect.top) / (rect.bottom - rect.top)) * props.height
        );
        if (x < 0 || x >= props.width || y < 0 || y >= props.height) {
          return;
        }

        let initX = nftSelectionInitX;
        let initY = nftSelectionInitY;
        let startX = initX;
        let startY = initY;
        let endX = x + 1;
        let endY = y + 1;
        if (x < initX) {
          startX = x;
          endX = initX + 1;
        } else {
          startX = initX;
          endX = x + 1;
        }
        if (y < initY) {
          startY = y;
          endY = initY + 1;
        } else {
          startY = initY;
          endY = y + 1;
        }
        let width = endX - startX;
        let height = endY - startY;
        setNftSelectionStartX(startX);
        setNftSelectionStartY(startY);
        setNftSelectionWidth(width);
        setNftSelectionHeight(height);
        props.setNftPosition(startX + startY * props.width);
        props.setNftWidth(width);
        props.setNftHeight(height);
        return;
      }
    };
    if (!props.nftSelected) {
      window.addEventListener('mousemove', updateFromEvent);
    }

    return () => {
      window.removeEventListener('mousemove', updateFromEvent);
    };
  }, [
    props.nftSelectionStarted,
    nftSelectionInitX,
    nftSelectionInitY,
    props.nftSelected
  ]);

  useEffect(() => {
    const mouseUp = async (event) => {
      if (
        !(
          event.target.classList.contains('ExtraPixelsCanvas') ||
          event.target.classList.contains('Canvas')
        )
      ) {
        return;
      }
      // TODO: Do nothing if dragging the canvas
      if (props.nftSelected) {
        return;
      }
      if (event.button === 0 && props.nftMintingMode) {
        if (!props.nftSelectionStarted) {
          const canvas = props.canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const x = Math.floor(
            ((event.clientX - rect.left) / (rect.right - rect.left)) *
              props.width
          );
          const y = Math.floor(
            ((event.clientY - rect.top) / (rect.bottom - rect.top)) *
              props.height
          );
          if (x < 0 || x >= props.width || y < 0 || y >= props.height) {
            return;
          }
          setNftSelectionInitX(x);
          setNftSelectionInitY(y);
          setNftSelectionStartX(x);
          setNftSelectionStartY(y);
          setNftSelectionWidth(1);
          setNftSelectionHeight(1);
          props.setNftPosition(x + y * props.width);
          props.setNftWidth(1);
          props.setNftHeight(1);
          props.setNftSelectionStarted(true);
          return;
        } else {
          const canvas = props.canvasRef.current;
          const rect = canvas.getBoundingClientRect();
          const x = Math.floor(
            ((event.clientX - rect.left) / (rect.right - rect.left)) *
              props.width
          );
          const y = Math.floor(
            ((event.clientY - rect.top) / (rect.bottom - rect.top)) *
              props.height
          );
          if (x < 0 || x >= props.width || y < 0 || y >= props.height) {
            return;
          }
          let initX = nftSelectionInitX;
          let initY = nftSelectionInitY;
          let startX = initX;
          let startY = initY;
          let endX = x + 1;
          let endY = y + 1;
          if (x < initX) {
            startX = x;
            endX = initX + 1;
          } else {
            startX = initX;
            endX = x + 1;
          }
          if (y < initY) {
            startY = y;
            endY = initY + 1;
          } else {
            startY = initY;
            endY = y + 1;
          }
          let width = endX - startX;
          let height = endY - startY;

          setNftSelectionStartX(startX);
          setNftSelectionStartY(startY);
          setNftSelectionWidth(width);
          setNftSelectionHeight(height);
          props.setNftPosition(startX + startY * props.width);
          props.setNftWidth(width);
          props.setNftHeight(height);
          props.setNftSelected(true);
        }
      }
    };
    window.addEventListener('mouseup', mouseUp);

    return () => {
      window.removeEventListener('mouseup', mouseUp);
    };
  }, [
    props.nftMintingMode,
    props.nftSelectionStarted,
    nftSelectionInitX,
    nftSelectionInitY
  ]);

  const [nftMintingOutline, setNftMintingOutline] = useState('none');
  const [nftMintingBorder, setNftMintingBorder] = useState('none');
  const [nftMintingShadow, setNftMintingShadow] = useState('none');
  useEffect(() => {
    if (props.nftMintingMode) {
      const outlineWidth = 1 * props.canvasScale;
      setNftMintingOutline(`${outlineWidth}px solid rgba(200, 0, 0, 0.3)`);
      const borderWidth = 0.1 * props.canvasScale;
      setNftMintingBorder(`${borderWidth}px solid rgba(100, 100, 100, 0.2)`);
      const shadowWidth = 0.5 * props.canvasScale;
      setNftMintingShadow(`0px 0px ${shadowWidth}px rgba(0, 0, 0, 0.3)`);
    } else {
      setNftMintingOutline('none');
      setNftMintingBorder('none');
      setNftMintingShadow('none');
    }
  }, [props.nftMintingMode, props.canvasScale]);

  return (
    <div
      className='NFTSelector'
      style={{
        left: nftSelectionStartX * props.canvasScale,
        top: nftSelectionStartY * props.canvasScale,
        width: nftSelectionWidth * props.canvasScale,
        height: nftSelectionHeight * props.canvasScale,
        outline: nftMintingOutline,
        border: nftMintingBorder,
        boxShadow: nftMintingShadow,
        pointerEvents: 'none',
        display:
          nftSelectionWidth === 0 && nftSelectionHeight == 0 ? 'none' : 'block'
      }}
    ></div>
  );
};

export default NFTSelector;
