import React, { useEffect, useState } from 'react';
import { useContractWrite } from '@starknet-react/core';
import './NFTMintingPanel.css';
import canvasConfig from '../../configs/canvas.config.json';
import { fetchWrapper } from '../../services/apiService.js';
import { devnetMode } from '../../utils/Consts.js';

const NFTMintingPanel = (props) => {
  // TODO: Arrows to control position and size
  const closePanel = () => {
    props.setNftMintingMode(false);
    props.setNftSelectionStarted(false);
    props.setNftSelected(false);
  };

  const toHex = (str) => {
    let hex = '0x';
    for (let i = 0; i < str.length; i++) {
      hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
  };

  const [calls, setCalls] = useState([]);
  const mintNftCall = (position, width, height, name) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract) return;
    // TODO: Validate the position, width, and height
    console.log('Minting NFT:', position, width, height);
    let mintParams = {
      position: position,
      width: width,
      height: height,
      name: toHex(name)
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
      props.setActiveTab('NFTs');
    };
    mintNft();
  }, [calls]);

  const { writeAsync, data, isPending } = useContractWrite({
    calls
  });

  const [nftName, setNftName] = useState('');
  const [isValidName, setIsValidName] = useState(false);
  const submit = async () => {
    if (nftName.length === 0 || nftName.length > 31) return;
    if (!isValidName) return;
    if (!devnetMode) {
      mintNftCall(props.nftPosition, props.nftWidth, props.nftHeight, nftName);
      return;
    }
    let mintNFTEndpoint = 'mint-nft-devnet';
    const response = await fetchWrapper(mintNFTEndpoint, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        position: props.nftPosition.toString(),
        width: props.nftWidth.toString(),
        height: props.nftHeight.toString(),
        name: toHex(nftName)
      })
    });
    if (response.result) {
      console.log(response.result);
      closePanel();
      props.setActiveTab('NFTs');
    }
  };

  const cancel = () => {
    props.setNftSelectionStarted(false);
    props.setNftSelected(false);
  };

  useEffect(() => {
    if (nftName.length === 0 || nftName.length > 31) {
      setIsValidName(false);
    } else {
      setIsValidName(true);
    }
  }, [nftName]);

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
            <p className='Text__small Heading__sub'>Size</p>
            <p className='Text__small NFTMintingPanel__item__text'>
              {props.nftWidth} x {props.nftHeight}
            </p>
          </div>
        </div>
      </div>
      {props.nftSelected && (
        <div className='NFTMintingPanel__form'>
          <div className='NFTMintingPanel__form__item'>
            <p className='Text__small'>Name</p>
            <input
              className='Text__small Input__primary NFTMintingPanel__form__input'
              type='text'
              placeholder='NFT name...'
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
            />
          </div>
          <div className='NFTMintingPanel__form__buttons'>
            <div
              className='Button__primary NFTMintingPanel__button'
              onClick={() => cancel()}
            >
              Cancel
            </div>
            <div
              className={`Button__primary NFTMintingPanel__button ${!isValidName ? 'Button__disabled' : ''}`}
              onClick={() => submit()}
            >
              Submit
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTMintingPanel;
