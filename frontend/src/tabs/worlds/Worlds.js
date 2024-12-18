import React, { useState, useEffect } from 'react';
import './Worlds.css';
import ExpandableTab from '../ExpandableTab.js';
import WorldItem from './WorldItem.js';
import { fetchWrapper } from '../../services/apiService.js';
import { worldImgUrl } from '../../utils/Consts.js';

import {
  getWorldsFn,
  getHotWorldsFn,
  getNewWorldsFn,
  getTopWorldsFn,
  getFavoriteWorldsFn
} from '../../services/apiService.js';
import { PaginationView } from '../../ui/pagination.js';

const WorldsMainSection = (props) => {
  return (
    <div
      className={`${props.expanded ? 'Worlds__main__expanded' : 'Worlds__main'}`}
    >
      <div className='Worlds__header'>
        <h2 className='Worlds__heading'>My Worlds</h2>
        <div className='Worlds__buttons'>
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
      <div className='Worlds__container'>
        {props.queryAddress === '0' && (
          <p className='Text__medium Worlds__nowallet'>
            Please login to view your Worlds
          </p>
        )}
        {props.topWorlds?.map((world) => {
          return (
            <WorldItem
              key={world.worldId}
              activeWorldId={props.activeWorldId}
              setActiveWorldId={props.setActiveWorldId}
              address={props.address}
              account={props.account}
              estimateInvokeFee={props.estimateInvokeFee}
              worldId={world.worldId}
              name={world.name}
              favorites={world.favorites}
              favorited={world.favorited}
              width={world.width}
              height={world.height}
              timer={world.timeBetweenPixels}
              host={world.host}
              starttime={world.startTime}
              endtime={world.endTime}
              image={worldImgUrl + '/world-' + world.worldId + '.png'}
              queryAddress={props.queryAddress}
              updateFavorites={props.updateFavorites}
              canvasFactoryContract={props.canvasFactoryContract}
            />
          );
        })}
        {props.favoriteWorlds.map((world, index) => {
          return (
            <WorldItem
              key={index}
              activeWorldId={props.activeWorldId}
              setActiveWorldId={props.setActiveWorldId}
              address={props.address}
              account={props.account}
              estimateInvokeFee={props.estimateInvokeFee}
              worldId={world.worldId}
              name={world.name}
              favorites={world.favorites}
              favorited={world.favorited}
              width={world.width}
              height={world.height}
              timer={world.timeBetweenPixels}
              host={world.host}
              starttime={world.startTime}
              endtime={world.endTime}
              image={worldImgUrl + '/world-' + world.worldId + '.png'}
              queryAddress={props.queryAddress}
              updateFavorites={props.updateFavorites}
              canvasFactoryContract={props.canvasFactoryContract}
            />
          );
        })}
        <PaginationView
          data={props.favoriteWorlds}
          stateValue={props.myWorldsPagination}
          setState={props.setMyWorldsPagination}
          style={{
            marginBottom: '25px'
          }}
        />
        {props.queryAddress !== '0' && (
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            <p
              className='Text__medium Button__primary'
              onClick={() => {
                props.setWorldsCreationMode(true);
                props.setActiveTab('Canvas');
              }}
            >
              Create World
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const WorldsExpandedSection = (props) => {
  return (
    <div className='Worlds__all'>
      <div className='Worlds__header'>
        <h2 className='Worlds__heading'>Explore</h2>
        <div className='Worlds__filters'>
          {props.filters.map((filter, index) => {
            return (
              <div
                key={index}
                className={`Worlds__button Worlds__filter ${props.activeFilter === filter ? 'Worlds__button--selected' : ''}`}
                onClick={() => props.setActiveFilter(filter)}
              >
                {filter}
              </div>
            );
          })}
        </div>
      </div>
      <div className='Worlds__all__container'>
        <div className='Worlds__all__grid'>
          {props.allWorlds.map((world, index) => {
            return (
              <WorldItem
                key={index}
                activeWorldId={props.activeWorldId}
                setActiveWorldId={props.setActiveWorldId}
                address={props.address}
                account={props.account}
                estimateInvokeFee={props.estimateInvokeFee}
                worldId={world.worldId}
                name={world.name}
                favorites={world.favorites}
                favorited={world.favorited}
                width={world.width}
                height={world.height}
                timer={world.timeBetweenPixels}
                host={world.host}
                starttime={world.startTime}
                endtime={world.endTime}
                image={worldImgUrl + '/world-' + world.worldId + '.png'}
                queryAddress={props.queryAddress}
                updateFavorites={props.updateFavorites}
                canvasFactoryContract={props.canvasFactoryContract}
              />
            );
          })}
        </div>
        <PaginationView
          data={props.allWorlds}
          setState={props.setAllWorldsPagination}
          stateValue={props.allWorldsPagination}
        />
      </div>
      {props.queryAddress !== '0' && (
        <div>
          <p
            className='Text__medium Button__primary'
            onClick={() => {
              props.setWorldsCreationMode(true);
              props.setActiveTab('Canvas');
            }}
          >
            Create World
          </p>
        </div>
      )}
    </div>
  );
};

const Worlds = (props) => {
  const [favoriteWorlds, setFavoriteWorlds] = useState([]);
  const [allWorlds, setAllWorlds] = useState([]);
  const [myWorldsPagination, setMyWorldsPagination] = useState({
    pageLength: 6,
    page: 1
  });
  const [allWorldsPagination, setAllWorldsPagination] = useState({
    pageLength: 24,
    page: 1
  });

  useEffect(() => {
    async function getMyWorlds() {
      try {
        const result = await getFavoriteWorldsFn({
          page: myWorldsPagination.page,
          pageLength: myWorldsPagination.pageLength,
          queryAddress: props.queryAddress
        });

        if (result.data) {
          if (myWorldsPagination.page === 1) {
            setFavoriteWorlds(result.data);
          } else {
            setFavoriteWorlds([...favoriteWorlds, ...result.data]);
          }
        }
      } catch (error) {
        console.log('Error fetching Worlds', error);
      }
    }
    getMyWorlds();
  }, [
    props.queryAddress,
    myWorldsPagination.page,
    myWorldsPagination.pageLength
  ]);

  const [expanded, setExpanded] = useState(false);
  const filters = ['hot', 'new', 'top'];
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    async function getWorlds() {
      try {
        let result;
        if (activeFilter === 'hot') {
          result = await getHotWorldsFn({
            page: allWorldsPagination.page,
            pageLength: allWorldsPagination.pageLength,
            queryAddress: props.queryAddress
          });
        } else if (activeFilter === 'new') {
          result = await getNewWorldsFn({
            page: allWorldsPagination.page,
            pageLength: allWorldsPagination.pageLength,
            queryAddress: props.queryAddress
          });
        } else if (activeFilter === 'top') {
          result = await getTopWorldsFn({
            page: allWorldsPagination.page,
            pageLength: allWorldsPagination.pageLength,
            queryAddress: props.queryAddress
          });
        } else {
          result = await getWorldsFn({
            page: allWorldsPagination.page,
            pageLength: allWorldsPagination.pageLength,
            queryAddress: props.queryAddress
          });
        }

        if (result.data) {
          if (allWorldsPagination.page === 1) {
            setAllWorlds(result.data);
          } else {
            const newWorlds = result.data.filter(
              (world) =>
                !allWorlds.some(
                  (existingWorld) => existingWorld.id === world.id
                )
            );
            setAllWorlds([...allWorlds, ...newWorlds]);
          }
        }
      } catch (error) {
        console.log('Error fetching Worlds', error);
      }
    }
    getWorlds();
  }, [props.queryAddress, expanded, allWorldsPagination]);

  const resetPagination = () => {
    setAllWorldsPagination((prev) => ({
      ...prev,
      page: 1
    }));
  };

  useEffect(() => {
    resetPagination();
  }, [activeFilter]);

  const [activeWorldId, setActiveWorldId] = useState(props.openedWorldId);
  const [activeWorld, setActiveWorld] = useState(null);
  useEffect(() => {
    const getWorld = async () => {
      const getWorldPath = `get-world?worldId=${activeWorldId}`;
      const response = await fetchWrapper(getWorldPath);
      if (!response.data) {
        return;
      }
      setActiveWorld(response.data);
      // Route path to "/worlds/:worldId" when activeWorldId changes
      let path = `/worlds/${response.data.uniqueName}`;
      window.history.pushState({}, '', path);
    };
    if (activeWorldId === null) {
      return;
    }
    getWorld();
  }, [activeWorldId]);

  const updateFavorites = (worldId, favorites, favorited) => {
    let newFavoriteWorlds = favoriteWorlds.map((world) => {
      if (world.worldId === worldId) {
        return { ...world, favorites: favorites, favorited: favorited };
      }
      return world;
    });

    let newAllWorldss = allWorlds.map((world) => {
      if (world.worldId === worldId) {
        return { ...world, favorites: favorites, favorited: favorited };
      }
      return world;
    });

    setFavoriteWorlds(newFavoriteWorlds);
    setAllWorlds(newAllWorldss);
  };

  return (
    <ExpandableTab
      title='Worlds'
      mainSection={WorldsMainSection}
      expandedSection={WorldsExpandedSection}
      activeWorld={activeWorld}
      activeWorldId={activeWorldId}
      setActiveWorldId={setActiveWorldId}
      address={props.address}
      account={props.account}
      estimateInvokeFee={props.estimateInvokeFee}
      setWorldsCreationMode={props.setWorldsCreationMode}
      setMyWorldsPagination={setMyWorldsPagination}
      myWorldsPagination={myWorldsPagination}
      allWorlds={allWorlds}
      setAllWorldsPagination={setAllWorldsPagination}
      allWorldsPagination={allWorldsPagination}
      favoriteWorlds={favoriteWorlds}
      setFavoriteWorlds={setFavoriteWorlds}
      updateFavorites={updateFavorites}
      setActiveTab={props.setActiveTab}
      expanded={expanded}
      setExpanded={setExpanded}
      queryAddress={props.queryAddress}
      setAllWorlds={setAllWorlds}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      filters={filters}
      isMobile={props.isMobile}
      gameEnded={props.gameEnded}
      canvasFactoryContract={props.canvasFactoryContract}
      topWorlds={props.topWorlds}
    />
  );
};

export default Worlds;
