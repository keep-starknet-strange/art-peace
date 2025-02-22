import React, { useState, useEffect } from 'react';
import './NFTs.css';
import ExpandableTab from '../ExpandableTab.js';
import NFTItem from './NFTItem.js';
import { nftUrl } from '../../utils/Consts.js';
import {
  fetchWrapper,
  getMyNftsFn,
  getNftsFn,
  getNewNftsFn,
  getTopNftsFn,
  getHotNftsFn,
  getLikedNftsFn
} from '../../services/apiService.js';
import { PaginationView } from '../../ui/pagination.js';

const NFTsMainSection = (props) => {
  const roundNumber = process.env.REACT_APP_ROUND_NUMBER || '0';
  const imageURL = `${nftUrl}/nft/round-${roundNumber}/images/`;
  const metadataURL = `${nftUrl}/nft/round-${roundNumber}/metadata/`;
  return (
    <div
      className={`${props.expanded ? 'NFTs__main__expanded' : 'NFTs__main'}`}
    >
      <div className='NFTs__header'>
        <h2 className='NFTs__heading'>My Collection</h2>
        <div className='NFTs__buttons'>
          {!props.gameEnded && props.queryAddress !== '0' && (
            <div
              className={`Button__primary Text__small ${
                props.nftMintingMode ? 'NFTs__button--selected' : ''
              }`}
              onClick={() => {
                props.setNftMintingMode(true);
                props.setActiveTab('Canvas');
              }}
            >
              Mint
            </div>
          )}
          {!props.expanded && (
            <div
              className='Text__small Button__primary'
              onClick={() => {
                props.setExpanded(true);
              }}
            >
              Explore
            </div>
          )}
        </div>
      </div>
      <div className='NFTs__container'>
        {props.queryAddress === '0' && (
          <p className='Text__medium NFTs__nowallet'>
            Please login to view your NFTs
          </p>
        )}
        {props.nftsCollection.map((nft, index) => {
          return (
            <NFTItem
              key={index}
              address={props.address}
              account={props.account}
              estimateInvokeFee={props.estimateInvokeFee}
              artPeaceContract={props.artPeaceContract}
              canvasNftContract={props.canvasNftContract}
              tokenId={nft.tokenId}
              position={nft.position}
              image={imageURL + 'nft-' + nft.tokenId + '.png'}
              metadata={metadataURL + 'nft-' + nft.tokenId + '.json'}
              width={nft.width}
              height={nft.height}
              name={nft.name}
              blockNumber={nft.blockNumber}
              likes={nft.likes}
              liked={nft.liked}
              minter={nft.minter}
              queryAddress={props.queryAddress}
              updateLikes={props.updateLikes}
              setTemplateOverlayMode={props.setTemplateOverlayMode}
              setOverlayTemplate={props.setOverlayTemplate}
              setActiveTab={props.setActiveTab}
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
  const maxRound = parseInt(process.env.REACT_APP_ROUND_NUMBER || '1');
  const [currentRound, setCurrentRound] = useState(maxRound);
  const imageURL = `${nftUrl}/nft/round-${currentRound}/images/`;
  const metadataURL = `${nftUrl}/nft/round-${currentRound}/metadata/`;

  const handleRoundChange = (direction) => {
    if (direction === 'prev' && currentRound > 1) {
      setCurrentRound((prev) => prev - 1);
      props.setAllNftPagination((prev) => ({ ...prev, page: 1 }));
    } else if (direction === 'next' && currentRound < maxRound) {
      setCurrentRound((prev) => prev + 1);
      props.setAllNftPagination((prev) => ({ ...prev, page: 1 }));
    }
  };

  return (
    <div className='NFTs__all'>
      <div className='NFTs__header'>
        <h2 className='NFTs__heading'>Explore</h2>
        <div className='NFTs__filters'>
          {props.filters.map((filter, index) => (
            <div
              key={index}
              className={`NFTs__button NFTs__filter ${
                props.activeFilter === filter ? 'NFTs__button--selected' : ''
              }`}
              onClick={() => props.setActiveFilter(filter)}
            >
              {filter}
            </div>
          ))}
          <div
            className='NFTs__button NFTs__filter'
            onClick={() => handleRoundChange('prev')}
          >
            {'<'}
          </div>
          <div className='NFTs__button NFTs__filter'>
            {`Round ${currentRound}`}
          </div>
          <div
            className='NFTs__button NFTs__filter'
            onClick={() => handleRoundChange('next')}
          >
            {'>'}
          </div>
        </div>
      </div>
      <div className='NFTs__all__container'>
        <div className='NFTs__all__grid'>
          {currentRound === maxRound &&
            (props.allNfts.length > 0 || props.activeFilter !== 'liked') &&
            props.allNfts.map((nft, index) => (
              <NFTItem
                key={index}
                {...nft}
                address={props.address}
                account={props.account}
                estimateInvokeFee={props.estimateInvokeFee}
                artPeaceContract={props.artPeaceContract}
                canvasNftContract={props.canvasNftContract}
                image={imageURL + 'nft-' + nft.tokenId + '.png'}
                metadata={metadataURL + 'nft-' + nft.tokenId + '.json'}
                queryAddress={props.queryAddress}
                updateLikes={props.updateLikes}
                setTemplateOverlayMode={props.setTemplateOverlayMode}
                setOverlayTemplate={props.setOverlayTemplate}
                setActiveTab={props.setActiveTab}
              />
            ))}
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
      let getNFTByTokenId = `get-nft?tokenId=${tokenId}`;
      const response = await fetchWrapper(getNFTByTokenId, { mode: 'cors' });
      if (response.data) {
        let newNFTs = [response.data, ...myNFTs];
        let uniqueNFTs = newNFTs.filter(
          (nft, index, self) =>
            index === self.findIndex((t) => t.tokenId === nft.tokenId)
        );
        setMyNFTs(uniqueNFTs);
      }
    } catch (error) {
      console.error('Error fetching NFT data:', error);
    }
  };

  const updateLikes = (tokenId, likes, liked) => {
    let newMyNFTs = myNFTs.map((nft) => {
      if (nft.tokenId === tokenId) {
        return { ...nft, likes: likes, liked: liked };
      }
      return nft;
    });

    let newAllNFTs = allNFTs.map((nft) => {
      if (nft.tokenId === tokenId) {
        return { ...nft, likes: likes, liked: liked };
      }
      return nft;
    });

    setMyNFTs(newMyNFTs);
    setAllNFTs(newAllNFTs);
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
  const filters = ['hot', 'new', 'top', 'liked'];
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    async function getNfts() {
      try {
        let result;
        if (activeFilter === 'hot') {
          result = await getHotNftsFn({
            page: allNftPagination.page,
            pageLength: allNftPagination.pageLength,
            queryAddress: props.queryAddress
          });
        } else if (activeFilter === 'new') {
          result = await getNewNftsFn({
            page: allNftPagination.page,
            pageLength: allNftPagination.pageLength,
            queryAddress: props.queryAddress
          });
        } else if (activeFilter === 'top') {
          result = await getTopNftsFn({
            page: allNftPagination.page,
            pageLength: allNftPagination.pageLength,
            queryAddress: props.queryAddress
          });
        } else if (activeFilter === 'liked') {
          result = await getLikedNftsFn({
            page: allNftPagination.page,
            pageLength: allNftPagination.pageLength,
            queryAddress: props.queryAddress
          });
        } else {
          result = await getNftsFn({
            page: allNftPagination.page,
            pageLength: allNftPagination.pageLength,
            queryAddress: props.queryAddress
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
  }, [props.queryAddress, expanded, allNftPagination, activeFilter]);

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
      updateLikes={updateLikes}
      address={props.address}
      account={props.account}
      estimateInvokeFee={props.estimateInvokeFee}
      artPeaceContract={props.artPeaceContract}
      canvasNftContract={props.canvasNftContract}
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
      isMobile={props.isMobile}
      gameEnded={props.gameEnded}
      setTemplateOverlayMode={props.setTemplateOverlayMode}
      setOverlayTemplate={props.setOverlayTemplate}
    />
  );
};

export default NFTs;
