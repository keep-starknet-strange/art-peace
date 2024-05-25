import React, { useState } from 'react';
import './NFTs.css';
import ExpandableTab from '../ExpandableTab.js';
import CollectionItem from './CollectionItem.js';
import NFTItem from './NFTItem.js';
import { backendUrl } from '../../utils/Consts.js';
import {
  fetchWrapper,
  getMyNftsFn,
  getNftsFn
} from '../../services/apiService.js';
import { PaginationView } from '../../ui/pagination.js';

//Expected shape of data from backend.
const mockNftData = {
  data: [],
  totalPages: 4,
  pageLength: 10
};

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
      <>
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
        <PaginationView
          totalPages={mockNftData.totalPages}
          pageLength={mockNftData.pageLength}
          currentPage={mockNftData.currentPage}
          stateValue={props.myNftPagination}
          setState={props.setMyNftPagination}
        />
      </>
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

      <>
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
        <PaginationView
          totalPages={mockNftData.totalPages}
          pageLength={mockNftData.pageLength}
          page={mockNftData.page}
          currentPage={mockNftData.currentPage}
          setState={props.setAllNftPagination}
          stateValue={props.allNftPagination}
        />
      </>
    </div>
  );
};

const NFTs = (props) => {
  // TODO: Minted nfts view w/ non owned nfts
  const [myNFTs, setMyNFTs] = React.useState([]);
  const [allNFTs, setAllNFTs] = React.useState([]);
  const [myNftPagination, setMyNftPagination] = useState({
    pageLength: 10,
    page: 1
  });
  const [allNftPagination, setAllNftPagination] = useState({
    pageLength: 10,
    page: 1
  });

  const retrieveMyNFTById = async (tokenId) => {
    try {
      let getNFTBtTokenId = `get-nfts?tokenId=${tokenId}`;
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
    async function getMyNfts() {
      try {
        const result = await getMyNftsFn({
          page: myNftPagination.page,
          pageLength: myNftPagination.pageLength,
          queryAddress: props.queryAddress
        });
        if (result.data) {
          setMyNFTs(result.data);
        }
      } catch (error) {
        console.log('Error fetching Nfts', error);
      }
    }
    getMyNfts();
  }, [props.queryAddress, myNftPagination.page, myNftPagination.pageLength]);

  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => {
    if (!expanded) {
      return;
    }
    async function getNfts() {
      try {
        const result = await getNftsFn({
          page: allNftPagination.page,
          pageLength: allNftPagination.pageLength
        });
        if (result.data) {
          setAllNFTs(result.data);
        }
      } catch (error) {
        console.log('Error fetching Nfts', error);
      }
    }
    getNfts();
  }, [
    props.queryAddress,
    expanded,
    allNftPagination.page,
    allNftPagination.pageLength
  ]);

  return (
    <ExpandableTab
      title='NFTs'
      mainSection={NFTsMainSection}
      expandedSection={NFTsExpandedSection}
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
    />
  );
};

export default NFTs;
