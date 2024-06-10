import React, { useState, useEffect } from 'react';
import './NFTs.css';
import ExpandableTab from '../ExpandableTab.js';
import NFTItem from './NFTItem.js';
import { backendUrl } from '../../utils/Consts.js';
import {
  fetchWrapper,
  getMyNftsFn,
  getNftsFn,
  getTopNftsFn
} from '../../services/apiService.js';
import { PaginationView } from '../../ui/pagination.js';

const NFTsMainSection = (props) => {
  const imageURL = backendUrl + '/nft-images/';
  return (
    <div
      className={`${props.expanded ? 'NFTs__main_hidden_mobile' : ''} NFTs__main`}
    >
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
        <PaginationView
          data={props.nftsCollection}
          stateValue={props.myNftPagination}
          setState={props.setMyNftPagination}
        />
      </div>
    </div>
  );
};

const NFTsExpandedSection = (props) => {
  const imageURL = backendUrl + '/nft-images/';

  return (
    <div className='NFTs__all'>
      <div className='NFTs__header'>
        <h2 className='NFTs__heading'>Explore</h2>
        <div className='NFTs__filters'>
          {props.filters.map((filter, index) => {
            return (
              <div
                key={index}
                className={`NFTs__button NFTs__filter ${props.activeFilter === filter ? 'NFTs__button--selected' : ''}`}
                onClick={() => props.setActiveFilter(filter)}
              >
                {filter}
              </div>
            );
          })}
        </div>
      </div>

      <div className='NFTs__all__container'>
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
        <PaginationView
          data={props.allNfts}
          setState={props.setAllNftPagination}
          stateValue={props.allNftPagination}
        />
      </div>
    </div>
  );
};

const NFTs = (props) => {
  const [myNFTs, setMyNFTs] = useState([]);
  const [allNFTs, setAllNFTs] = useState([]);
  const [myNftPagination, setMyNftPagination] = useState({
    pageLength: 6,
    page: 1
  });
  const [allNftPagination, setAllNftPagination] = useState({
    pageLength: 24,
    page: 1
  });

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

  useEffect(() => {
    if (
      props.latestMintedTokenId !== null &&
      myNFTs.findIndex((nft) => nft.tokenId === props.latestMintedTokenId) ===
        -1
    ) {
      retrieveMyNFTById(props.latestMintedTokenId);
      props.setLatestMintedTokenId(null);
    }
  }, [props.latestMintedTokenId]);

  useEffect(() => {
    async function getMyNfts() {
      try {
        const result = await getMyNftsFn({
          page: myNftPagination.page,
          pageLength: myNftPagination.pageLength,
          queryAddress: props.queryAddress
        });

        if (result.data) {
          if (myNftPagination.page === 1) {
            setMyNFTs(result.data);
          } else {
            setMyNFTs([...myNFTs, ...result.data]);
          }
        }
      } catch (error) {
        console.log('Error fetching NFTs', error);
      }
    }
    getMyNfts();
  }, [props.queryAddress, myNftPagination.page, myNftPagination.pageLength]);

  const [expanded, setExpanded] = useState(false);
  const filters = ['hot', 'new', 'top'];
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    async function getNfts() {
      try {
        let result;
        if (activeFilter === 'top') {
          result = await getTopNftsFn({
            page: allNftPagination.page,
            pageLength: allNftPagination.pageLength
          });
        } else {
          result = await getNftsFn({
            page: allNftPagination.page,
            pageLength: allNftPagination.pageLength
          });
        }

        if (result.data) {
          if (allNftPagination.page === 1) {
            setAllNFTs(result.data);
          } else {
            const newNfts = result.data.filter(
              (nft) =>
                !allNFTs.some(
                  (existingNft) => existingNft.tokenId === nft.tokenId
                )
            );
            setAllNFTs([...allNFTs, ...newNfts]);
          }
        }
      } catch (error) {
        console.log('Error fetching NFTs', error);
      }
    }
    getNfts();
  }, [
    props.queryAddress,
    expanded,
    activeFilter,
    allNftPagination.page,
    allNftPagination.pageLength
  ]);

  const resetPagination = () => {
    setAllNftPagination((prev) => ({
      ...prev,
      page: 1
    }));
  };

  useEffect(() => {
    resetPagination();
  }, [activeFilter]);

  return (
    <ExpandableTab
      title='NFTs'
      mainSection={NFTsMainSection}
      expandedSection={NFTsExpandedSection}
      nftMintingMode={props.nftMintingMode}
      setNftMintingMode={props.setNftMintingMode}
      nftsCollection={myNFTs}
      setMyNftPagination={setMyNftPagination}
      myNftPagination={myNftPagination}
      allNfts={allNFTs}
      setAllNftPagination={setAllNftPagination}
      allNftPagination={allNftPagination}
      setActiveTab={props.setActiveTab}
      expanded={expanded}
      setExpanded={setExpanded}
      queryAddress={props.queryAddress}
      setAllNFTs={setAllNFTs}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      filters={filters}
    />
  );
};

export default NFTs;
