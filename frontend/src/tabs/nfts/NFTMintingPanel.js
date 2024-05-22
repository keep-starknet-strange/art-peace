import React, { useEffect, useState } from 'react';
import { useContractWrite } from '@starknet-react/core';
import './NFTMintingPanel.css';
import canvasConfig from '../../configs/canvas.config.json';
import { fetchWrapper } from '../../services/apiService.js';
import { devnetMode } from '../../utils/Consts.js';

const NFTMintingPanel = (props) => {
  const closePanel = () => {
    props.setNftMintingMode(false);
    props.setNftSelectionStarted(false);
    props.setNftSelected(false);
  };

  const [calls, setCalls] = useState([]);
  const mintNftCall = (position, width, height) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract) return;
    // TODO: Validate the position, width, and height
    console.log('Minting NFT:', position, width, height);
    let mintParams = {
      position: position,
      width: width,
      height: height
    };
    setCalls(
      props.artPeaceContract.populateTransaction['mint_nft'](mintParams)
    );
  };

  useEffect(() => {
    const mintNft = async () => {
      if (devnetMode) return;
      if (calls.length === 0) return;
      await writeAsync();
      console.log('Mint nft successful:', data, isPending);
      // TODO: Update the UI with the new NFT
      closePanel();
    };
    mintNft();
  }, [calls]);

  const { writeAsync, data, isPending } = useContractWrite({
    calls
  });

  const submit = async () => {
    if (!devnetMode) {
      mintNftCall(props.nftPosition, props.nftWidth, props.nftHeight);
      return;
    }
    let mintNFTEndpoint = 'mint-nft-devnet';
    const response = await fetchWrapper(mintNFTEndpoint, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        position: props.nftPosition.toString(),
        width: props.nftWidth.toString(),
        height: props.nftHeight.toString()
      })
    });
    if (response.result) {
      console.log(response.result);
      closePanel();
    }
  };

  // TODO: Add preview of the NFT && Add input fields for the NFT metadata
  return (
    <div className='NFTMintingPanel'>
      <p
        className='Button__close NFTMintingPanel__close'
        onClick={() => closePanel()}
      >
        X
      </p>
      <div className='NFTMintingPanel__header'>
        <p className='Text__medium Heading__sub'>art/peace NFT Mint</p>
        {props.nftSelected && (
          <div className='Button__primary' onClick={() => submit()}>
            Submit
          </div>
        )}
      </div>
      <div className='NFTMintingPanel__notes'>
        {props.nftSelectionStarted === false && (
          <p
            className='Text__xsmall'
            style={{
              margin: '0.5rem',
              padding: '0'
            }}
          >
            Click on the canvas to start...
          </p>
        )}
        {props.nftSelectionStarted && props.nftSelected == false && (
          <p
            className='Text__xsmall'
            style={{
              margin: '0.5rem',
              padding: '0'
            }}
          >
            Click to select the nft image area...
          </p>
        )}
        {props.nftSelected && (
          <p
            className='Text__xsmall'
            style={{
              margin: '0.5rem',
              padding: '0'
            }}
          >
            Fill out the form and submit...
          </p>
        )}
      </div>
      <div className='NFTMintingPanel__body'>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}
        >
          <div className='NFTMintingPanel__item'>
            <p className='Text__small Heading__sub'>Position</p>
            <p className='Text__small NFTMintingPanel__item__text'>
              ({props.nftPosition % canvasConfig.canvas.width},
              {Math.floor(props.nftPosition / canvasConfig.canvas.width)})
            </p>
          </div>
          <div className='NFTMintingPanel__item'>
            <p className='Text__small Heading__sub'>Width</p>
            <p className='Text__small NFTMintingPanel__item__text'>
              {props.nftWidth}
            </p>
          </div>
          <div className='NFTMintingPanel__item'>
            <p className='Text__small Heading__sub'>Height</p>
            <p className='Text__small NFTMintingPanel__item__text'>
              {props.nftHeight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTMintingPanel;
