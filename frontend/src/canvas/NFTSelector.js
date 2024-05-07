import React, { useState, useEffect } from 'react';
import './NFTSelector.css';
import { fetchWrapper } from '../services/apiService.js';

const NFTSelector = (props) => {
  const [nftSelectionPositionX, setNftSelectionPositionX] = useState(-1);
  const [nftSelectionPositionY, setNftSelectionPositionY] = useState(-1);
  const [nftSelectionWidth, setNftSelectionWidth] = useState(0);
  const [nftSelectionHeight, setNftSelectionHeight] = useState(0);
  const [nftSelectionStartX, setNftSelectionStartX] = useState(0);
  const [nftSelectionStartY, setNftSelectionStartY] = useState(0);
  const [nftSelectionEndX, setNftSelectionEndX] = useState(0);
  const [nftSelectionEndY, setNftSelectionEndY] = useState(0);
  const [nftSelectionStarted, setNftSelectionStarted] = useState(false);

  useEffect(() => {
    const updateFromEvent = (event) => {
      if (!nftSelectionStarted) {
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
        return;
      }
    };
    window.addEventListener('mousemove', updateFromEvent);

    return () => {
      window.removeEventListener('mousemove', updateFromEvent);
    };
  }, [
    nftSelectionStarted,
    nftSelectionStartX,
    nftSelectionStartY,
    nftSelectionEndX,
    nftSelectionEndY,
    nftSelectionPositionX,
    nftSelectionPositionY,
    props.width,
    props.height,
    props.canvasScale
  ]);

  useEffect(() => {
    const mouseUp = async (event) => {
      // TODO: Do nothing if dragging the canvas
      if (event.button === 0 && props.nftMintingMode) {
        if (!nftSelectionStarted) {
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
          setNftSelectionStarted(true);
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

          // Mint NFT
          let mintNFTEndpoint = 'mint-nft-devnet';
          let nftPosition =
            nftSelectionPositionX + nftSelectionPositionY * props.width;
          let nftWidth = nftSelectionWidth;
          let nftHeight = nftSelectionHeight;
          const response = await fetchWrapper(mintNFTEndpoint, {
            mode: 'cors',
            method: 'POST',
            body: JSON.stringify({
              position: nftPosition.toString(),
              width: nftWidth.toString(),
              height: nftHeight.toString()
            })
          });
          if (response.result) {
            console.log(response.result);
          }
          setNftSelectionStarted(false);
          setNftSelectionPositionX(-1);
          setNftSelectionPositionY(-1);
          setNftSelectionWidth(0);
          setNftSelectionHeight(0);
          setNftSelectionStartX(0);
          setNftSelectionStartY(0);
          setNftSelectionEndX(0);
          setNftSelectionEndY(0);
          props.setNftMintingMode(false);
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
    nftSelectionStarted,
    nftSelectionStartX,
    nftSelectionStartY,
    nftSelectionEndX,
    nftSelectionEndY,
    nftSelectionPositionX,
    nftSelectionPositionY
  ]);

  const [nftMintingOutline, setNftMintingOutline] = useState('none');
  useEffect(() => {
    if (props.nftMintingMode) {
      const outlineWidth = 1 * props.canvasScale;
      setNftMintingOutline(`${outlineWidth}px solid rgba(255, 0, 0, 0.5)`);
    } else {
      setNftMintingOutline('none');
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
        pointerEvents: 'none',
        display:
          nftSelectionWidth === 0 && nftSelectionHeight == 0 ? 'none' : 'block'
      }}
    ></div>
  );
};

export default NFTSelector;
