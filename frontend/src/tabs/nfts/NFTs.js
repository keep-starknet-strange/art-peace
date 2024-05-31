import React from 'react';
import './NFTs.css';
import ExpandableTab from '../ExpandableTab.js';
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
          className={`NFTs__button ${props.nftMintingMode ? 'NFTs__button--selected' : ''}`}
          onClick={() => props.setNftMintingMode(true)}
        >
          Mint
        </div>
      </div>
      <div className='NFTs__container'>
        {props.nftsCollection.map((nft, index) => {
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
              liked={nft.liked}
              minter={nft.minter}
              queryAddress={props.queryAddress}
            />
          );
        })}
      </div>
    </div>
  );
};

const NFTsExpandedSection = (props) => {
  const imageURL = backendUrl + '/nft-images/';
  // TODO: Implement filters
  const filters = ['hot', 'new', 'top'];
  const [activeFilter, setActiveFilter] = React.useState(filters[0]);
  return (
    <div className='NFTs__all'>
      <div className='NFTs__header'>
        <h2 className='NFTs__heading'>Explore</h2>
        <div className='NFTs__filters'>
          {filters.map((filter, index) => {
            return (
              <div
                key={index}
                className={`NFTs__button NFTs__filter ${activeFilter === filter ? 'NFTs__button--selected' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </div>
            );
          })}
        </div>
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
              liked={nft.liked}
              minter={nft.minter}
              queryAddress={props.queryAddress}
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
    let getNFTsEndpoint = `get-nfts?address=${props.queryAddress}`;
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
      nftMintingMode={props.nftMintingMode}
      setNftMintingMode={props.setNftMintingMode}
      nftsCollection={myNFTs}
      allNfts={allNFTs}
      setActiveTab={props.setActiveTab}
      expanded={expanded}
      setExpanded={setExpanded}
      queryAddress={props.queryAddress}
    />
  );
};

export default NFTs;
