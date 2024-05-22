import React from 'react';
import './NFTs.css';
import ExpandableTab from '../ExpandableTab.js';
import CollectionItem from './CollectionItem.js';
import NFTItem from './NFTItem.js';
import { backendUrl } from '../../utils/Consts.js';
import { fetchWrapper } from '../../services/apiService.js';

const NFTsMainSection = (props) => {
  const imageURL = backendUrl + '/nft-images/';
  return (
    <div className='NFTs__main'>
      <div className='NFTs__header'>
        <h2 className='NFTs__heading'>My Collection</h2>
        <div
          className='NFTs__mint'
          onClick={() => props.setNftMintingMode(true)}
        >
          Mint
        </div>
      </div>
      <div className='NFTs__container'>
        {props.nftsCollection.map((nft, index) => {
          return (
            <CollectionItem
              key={index}
              tokenId={nft.tokenId}
              position={nft.position}
              image={imageURL + 'nft-' + nft.tokenId + '.png'}
              width={nft.width}
              height={nft.height}
              blockNumber={nft.blockNumber}
            />
          );
        })}
      </div>
    </div>
  );
};

const NFTsExpandedSection = (props) => {
  const imageURL = backendUrl + '/nft-images/';
  return (
    <div className='NFTs__all'>
      <div className='NFTs__header'>
        <h2 className='NFTs__heading'>All NFTs</h2>
      </div>
      <div className='NFTs__all__grid'>
        {props.allNfts.map((nft, index) => {
          return (
            <NFTItem
              key={index}
              tokenId={nft.tokenId}
              position={nft.position}
              image={imageURL + 'nft-' + nft.tokenId + '.png'}
              width={nft.width}
              height={nft.height}
              blockNumber={nft.blockNumber}
              likes={nft.likes}
              minter={nft.minter}
            />
          );
        })}
      </div>
    </div>
  );
};

const NFTs = (props) => {
  // TODO: Minted nfts view w/ non owned nfts
  const [myNFTs, setMyNFTs] = React.useState([]);
  const [allNFTs, setAllNFTs] = React.useState([]);

  const retrieveMyNFTById = async (tokenId) => {
    try {
      let getNFTBtTokenId = `get-nft?tokenId=${tokenId}`;
      const response = await fetchWrapper(getNFTBtTokenId, { mode: 'cors' });
      if (response.data) {
        setMyNFTs((prev) => [response.data, ...prev]);
      }
    } catch (error) {
      console.error('Error fetching NFT data:', error);
    }
  };

  React.useEffect(() => {
    if (
      props.latestMintedTokenId !== null &&
      myNFTs.findIndex((nft) => nft.tokenId === props.latestMintedTokenId) ===
        -1
    ) {
      retrieveMyNFTById(props.latestMintedTokenId);
      props.setLatestMintedTokenId(null);
    }
  }, [props.latestMintedTokenId]);

  React.useEffect(() => {
    // TODO
    let getMyNFTsEndpoint = `get-my-nfts?address=${props.queryAddress}`;
    async function getMyNfts() {
      const response = await fetchWrapper(getMyNFTsEndpoint, { mode: 'cors' });
      if (response.data) {
        setMyNFTs(response.data);
      }
    }
    getMyNfts();
  }, [props.queryAddress]);

  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => {
    if (!expanded) {
      return;
    }
    let getNFTsEndpoint = 'get-nfts';
    async function getNfts() {
      const response = await fetchWrapper(getNFTsEndpoint, { mode: 'cors' });
      if (response.data) {
        setAllNFTs(response.data);
      }
    }
    getNfts();
  }, [props.queryAddress, expanded]);

  return (
    <ExpandableTab
      title='NFTs'
      mainSection={NFTsMainSection}
      expandedSection={NFTsExpandedSection}
      setNftMintingMode={props.setNftMintingMode}
      nftsCollection={myNFTs}
      allNfts={allNFTs}
      setActiveTab={props.setActiveTab}
      expanded={expanded}
      setExpanded={setExpanded}
    />
  );
};

export default NFTs;
