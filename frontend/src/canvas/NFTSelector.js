import React, { useState, useEffect } from 'react';
import './NFTSelector.css';

const NFTSelector = (props) => {
  const [nftSelectionPositionX, setNftSelectionPositionX] = useState(-1);
  const [nftSelectionPositionY, setNftSelectionPositionY] = useState(-1);
  const [nftSelectionWidth, setNftSelectionWidth] = useState(0);
  const [nftSelectionHeight, setNftSelectionHeight] = useState(0);
  const [nftSelectionStartX, setNftSelectionStartX] = useState(0);
  const [nftSelectionStartY, setNftSelectionStartY] = useState(0);
  const [nftSelectionEndX, setNftSelectionEndX] = useState(0);
  const [nftSelectionEndY, setNftSelectionEndY] = useState(0);

  useEffect(() => {
    const updateFromEvent = (event) => {
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
        setNftSelectionEndX(x + 1);
        setNftSelectionEndY(y + 1);
        setNftSelectionPositionX(x);
        setNftSelectionPositionY(y);
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
        setNftSelectionEndX(x + 1);
        setNftSelectionEndY(y + 1);
        if (nftSelectionEndX <= nftSelectionStartX) {
          setNftSelectionPositionX(nftSelectionEndX - 1);
          setNftSelectionWidth(nftSelectionStartX - nftSelectionEndX + 1);
        } else {
          setNftSelectionPositionX(nftSelectionStartX);
          setNftSelectionWidth(nftSelectionEndX - nftSelectionStartX);
        }
        if (nftSelectionEndY <= nftSelectionStartY) {
          setNftSelectionPositionY(nftSelectionEndY - 1);
          setNftSelectionHeight(nftSelectionStartY - nftSelectionEndY + 1);
        } else {
          setNftSelectionPositionY(nftSelectionStartY);
          setNftSelectionHeight(nftSelectionEndY - nftSelectionStartY);
        }
        props.setNftPosition(
          nftSelectionPositionX + nftSelectionPositionY * props.width
        );
        props.setNftWidth(nftSelectionWidth);
        props.setNftHeight(nftSelectionHeight);
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
    nftSelectionStartX,
    nftSelectionStartY,
    nftSelectionEndX,
    nftSelectionEndY,
    nftSelectionPositionX,
    nftSelectionPositionY,
    props.width,
    props.height,
    props.canvasScale,
    props.nftSelected
  ]);

  // TODO: Fix one off issues with the selection
  useEffect(() => {
    const mouseUp = async (event) => {
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
          setNftSelectionStartX(x);
          setNftSelectionStartY(y);
          setNftSelectionEndX(x + 1);
          setNftSelectionEndY(y + 1);
          setNftSelectionPositionX(x);
          setNftSelectionPositionY(y);
          setNftSelectionWidth(1);
          setNftSelectionHeight(1);
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
          setNftSelectionEndX(x + 1);
          setNftSelectionEndY(y + 1);
          if (nftSelectionEndX <= nftSelectionStartX) {
            setNftSelectionPositionX(nftSelectionEndX - 1);
            setNftSelectionWidth(nftSelectionStartX - nftSelectionEndX + 1);
          } else {
            setNftSelectionPositionX(nftSelectionStartX);
            setNftSelectionWidth(nftSelectionEndX - nftSelectionStartX);
          }
          if (nftSelectionEndY <= nftSelectionStartY) {
            setNftSelectionPositionY(nftSelectionEndY - 1);
            setNftSelectionHeight(nftSelectionStartY - nftSelectionEndY + 1);
          } else {
            setNftSelectionPositionY(nftSelectionStartY);
            setNftSelectionHeight(nftSelectionEndY - nftSelectionStartY);
          }

          // Pass the selection to the parent
          props.setNftPosition(
            nftSelectionPositionX + nftSelectionPositionY * props.width
          );
          props.setNftWidth(nftSelectionWidth);
          props.setNftHeight(nftSelectionHeight);

          props.setNftSelected(true);
        }
      }
    };
    window.addEventListener('mouseup', mouseUp);

    return () => {
      window.removeEventListener('mouseup', mouseUp);
    };
  }, [
    props.canvasRef,
    props.nftMintingMode,
    props.width,
    props.height,
    props.nftSelectionStarted,
    nftSelectionStartX,
    nftSelectionStartY,
    nftSelectionEndX,
    nftSelectionEndY,
    nftSelectionPositionX,
    nftSelectionPositionY
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
        left: nftSelectionPositionX * props.canvasScale,
        top: nftSelectionPositionY * props.canvasScale,
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
