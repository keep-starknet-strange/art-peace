import React from 'react'
import './NFTs.css';
import ExpandableTab from '../ExpandableTab.js';
import CollectionItem from './CollectionItem.js';
import NFTItem from './NFTItem.js';
import backendConfig from "../../configs/backend.config.json"

const NFTsMainSection = props => {
  const backendUrl = "http://" + backendConfig.host + ":" + backendConfig.port
  const imageURL = backendUrl + "/nft-images/";
  return (
    <div className="NFTs__main">
      <div className="NFTs__header">
        <h2 className="NFTs__heading">My Collection</h2>
        <div className="NFTs__mint" onClick={() => props.setNftSelectionMode(true)}>Mint</div>
      </div>
      <div className="NFTs__container">
        {props.nftsCollection.map((nft, index) => {
          return <CollectionItem key={index} position={nft.position} image={imageURL + "nft-" + nft.tokenId + ".png"} width={nft.width} height={nft.height} blockNumber={nft.blockNumber} />
        })}
      </div>
    </div>
  );
}

const NFTsExpandedSection = props => {
  const backendUrl = "http://" + backendConfig.host + ":" + backendConfig.port
  const imageURL = backendUrl + "/nft-images/";
  return (
    <div className="NFTs__all">
      <div className="NFTs__header">
        <h2 className="NFTs__heading">All NFTs</h2>
      </div>
      <div className="NFTs__all__grid">
        {props.allNfts.map((nft, index) => {
          return <NFTItem key={index} position={nft.position} image={imageURL + "nft-" + nft.tokenId + ".png"} width={nft.width} height={nft.height} blockNumber={nft.blockNumber} likes={nft.likes} minter={nft.minter} />
        })}
      </div>
    </div>
  );
}

const NFTs = props => {
  const backendUrl = "http://" + backendConfig.host + ":" + backendConfig.port
  const [setup, setSetup] = React.useState(false);
  const [myNFTs, setMyNFTs] = React.useState([]);
  const [allNFTs, setAllNFTs] = React.useState([]);

  React.useEffect(() => {
    if (!setup) {
      setSetup(true);
    } else {
      return;
    }

    // TODO
    const addr = '0328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0';
    let getMyNFTsEndpoint = backendUrl + "/get-my-nfts?address=" + addr;
    fetch(getMyNFTsEndpoint, {mode: 'cors'}).then(response => {
      return response.json();
    }).then(data => {
      if (data === null) {
        data = [];
      }
      setMyNFTs(data);
    }).catch(err => {
      console.error(err);
    });

    let getNFTsEndpoint = backendUrl + "/get-nfts";
    fetch(getNFTsEndpoint, {mode: 'cors'}).then(response => {
      return response.json();
    }).then(data => {
      if (data === null) {
        data = [];
      }
      setAllNFTs(data);
    }).catch(err => {
      console.error(err);
    });

  }, [setup, backendUrl, setSetup, setMyNFTs, setAllNFTs]);

  return (
    <ExpandableTab title="NFTs" mainSection={NFTsMainSection} expandedSection={NFTsExpandedSection} setNftSelectionMode={props.setNftSelectionMode} nftsCollection={myNFTs} allNfts={allNFTs} />
  );
}

export default NFTs;
