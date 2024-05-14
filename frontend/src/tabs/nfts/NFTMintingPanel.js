import React from 'react';
import './NFTMintingPanel.css';
import canvasConfig from '../../configs/canvas.config.json';
import { fetchWrapper } from '../../services/apiService.js';

const NFTMintingPanel = (props) => {
  const closePanel = () => {
    props.setNftMintingMode(false);
  };

  const submit = async () => {
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
        <div className='Button__primary' onClick={() => submit()}>
          Submit
        </div>
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
