import React, { useState, useEffect, useRef } from 'react';
import './Stencils.css';
import ExpandableTab from '../ExpandableTab.js';
import StencilItem from './StencilItem.js';
import { fetchWrapper } from '../../services/apiService.js';
import { templateUrl } from '../../utils/Consts.js';

import {
  getStencilsFn,
  getHotStencilsFn,
  getNewStencilsFn,
  getTopStencilsFn,
  getFavoriteStencilsFn
} from '../../services/apiService.js';
import { PaginationView } from '../../ui/pagination.js';

const StencilsMainSection = (props) => {
  return (
    <div
      className={`${props.expanded ? 'Stencils__main__expanded' : 'Stencils__main'}`}
    >
      <div className='Stencils__header'>
        <h2 className='Stencils__heading'>Favorites</h2>
        <div className='Stencils__buttons'>
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
      <div className='Stencils__container'>
        {props.queryAddress === '0' && (
          <p className='Text__medium Stencils__nowallet'>
            Please login to view your favorite stencils
          </p>
        )}
        {props.activeStencil && !props.activeStencil.favorited && (
          <StencilItem
            key={props.activeStencil.stencilId}
            openedWorldId={props.openedWorldId}
            openedStencilId={props.openedStencilId}
            setOpenedStencilId={props.setOpenedStencilId}
            address={props.address}
            account={props.account}
            estimateInvokeFee={props.estimateInvokeFee}
            stencilId={props.activeStencil.stencilId}
            queryAddress={props.queryAddress}
            updateFavorites={props.updateFavorites}
            canvasFactoryContract={props.canvasFactoryContract}
            favorites={props.activeStencil.favorites}
            favorited={props.activeStencil.favorited}
            width={props.activeStencil.width}
            height={props.activeStencil.height}
            hash={props.activeStencil.hash}
            position={props.activeStencil.position}
            image={
              templateUrl +
              '/stencils/stencil-' +
              props.activeStencil.hash +
              '.png'
            }
            setTemplateOverlayMode={props.setTemplateOverlayMode}
            setOverlayTemplate={props.setOverlayTemplate}
            setActiveTab={props.setActiveTab}
          />
        )}
        {props.favoriteStencils.map((stencil, index) => {
          return (
            <StencilItem
              key={index}
              stencil={stencil}
              {...stencil}
              openedWorldId={props.openedWorldId}
              openedStencilId={props.openedStencilId}
              setOpenedStencilId={props.setOpenedStencilId}
              address={props.address}
              account={props.account}
              estimateInvokeFee={props.estimateInvokeFee}
              stencilId={stencil.stencilId}
              queryAddress={props.queryAddress}
              updateFavorites={props.updateFavorites}
              canvasFactoryContract={props.canvasFactoryContract}
              favorites={stencil.favorites}
              favorited={stencil.favorited}
              width={stencil.width}
              height={stencil.height}
              hash={stencil.hash}
              position={stencil.position}
              image={templateUrl + '/stencils/stencil-' + stencil.hash + '.png'}
              setTemplateOverlayMode={props.setTemplateOverlayMode}
              setOverlayTemplate={props.setOverlayTemplate}
              setActiveTab={props.setActiveTab}
            />
          );
        })}
        {props.recentFavoriteStencils &&
          props.recentFavoriteStencils.map((stencil, index) => (
            <StencilItem
              key={index}
              stencil={stencil}
              {...stencil}
              openedWorldId={props.openedWorldId}
              openedStencilId={props.openedStencilId}
              setOpenedStencilId={props.setOpenedStencilId}
              address={props.address}
              account={props.account}
              estimateInvokeFee={props.estimateInvokeFee}
              queryAddress={props.queryAddress}
              updateFavorites={props.updateFavorites}
              canvasFactoryContract={props.canvasFactoryContract}
              setTemplateOverlayMode={props.setTemplateOverlayMode}
              setOverlayTemplate={props.setOverlayTemplate}
              setActiveTab={props.setActiveTab}
              image={templateUrl + '/stencils/stencil-' + stencil.hash + '.png'}
            />
          ))}
        <PaginationView
          data={props.favoriteStencils}
          stateValue={props.myStencilsPagination}
          setState={props.setMyStencilsPagination}
          style={{
            marginBottom: '10px'
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
              onClick={props.uploadStencil}
            >
              Create Stencil
            </p>
            <input
              type='file'
              id='file'
              accept='.png'
              ref={props.inputFile}
              style={{ display: 'none' }}
              onChange={props.handleFileChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const StencilsExpandedSection = (props) => {
  return (
    <div className='Stencils__all'>
      <div className='Stencils__header'>
        <h2 className='Stencils__heading'>Explore</h2>
        <div className='Stencils__filters'>
          {props.filters.map((filter, index) => {
            return (
              <div
                key={index}
                className={`Stencils__button Stencils__filter ${props.activeFilter === filter ? 'Stencils__button--selected' : ''}`}
                onClick={() => props.setActiveFilter(filter)}
              >
                {filter}
              </div>
            );
          })}
        </div>
      </div>
      <div className='Stencils__all__container'>
        <div className='Stencils__all__grid'>
          {props.allStencils.map((stencil, index) => {
            return (
              <StencilItem
                key={index}
                stencil={stencil}
                openedStencilId={props.openedStencilId}
                setOpenedStencilId={props.setOpenedStencilId}
                address={props.address}
                account={props.account}
                estimateInvokeFee={props.estimateInvokeFee}
                stencilId={stencil.stencilId}
                queryAddress={props.queryAddress}
                updateFavorites={props.updateFavorites}
                canvasFactoryContract={props.canvasFactoryContract}
                favorites={stencil.favorites}
                favorited={stencil.favorited}
                width={stencil.width}
                height={stencil.height}
                hash={stencil.hash}
                position={stencil.position}
                image={
                  templateUrl + '/stencils/stencil-' + stencil.hash + '.png'
                }
                setTemplateOverlayMode={props.setTemplateOverlayMode}
                setOverlayTemplate={props.setOverlayTemplate}
                setActiveTab={props.setActiveTab}
              />
            );
          })}
        </div>
        <PaginationView
          data={props.allStencils}
          setState={props.setAllStencilsPagination}
          stateValue={props.allStencilsPagination}
        />
      </div>
      {props.queryAddress !== '0' && (
        <div>
          <p
            className='Text__medium Button__primary'
            onClick={props.uploadStencil}
          >
            Create Stencil
          </p>
        </div>
      )}
    </div>
  );
};

const Stencils = (props) => {
  const [favoriteStencils, setFavoriteStencils] = useState([]);
  const [allStencils, setAllStencils] = useState([]);
  const [myStencilsPagination, setMyStencilsPagination] = useState({
    pageLength: 6,
    page: 1
  });
  const [allStencilsPagination, setAllStencilsPagination] = useState({
    pageLength: 24,
    page: 1
  });

  const imageToPalette = (image) => {
    // Convert image pixels to be within the color palette

    // Get image data
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const data = imageData.data;

    let imagePalleteIds = [];
    // Convert image data to color palette
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 0;
        imagePalleteIds.push(255);
        continue;
      }
      let minDistance = 1000000;
      let minColor = props.colors[0];
      let minColorIndex = 0;
      for (let j = 0; j < props.colors.length; j++) {
        const color = props.colors[j]
          .match(/[A-Za-z0-9]{2}/g)
          .map((x) => parseInt(x, 16));
        const distance = Math.sqrt(
          Math.pow(data[i] - color[0], 2) +
            Math.pow(data[i + 1] - color[1], 2) +
            Math.pow(data[i + 2] - color[2], 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          minColor = color;
          minColorIndex = j;
        }
      }
      data[i] = minColor[0];
      data[i + 1] = minColor[1];
      data[i + 2] = minColor[2];
      imagePalleteIds.push(minColorIndex);
    }

    // Set image data back to canvas
    ctx.putImageData(imageData, 0, 0);
    return [canvas.toDataURL(), imagePalleteIds];
  };

  const inputFile = useRef();
  const uploadStencil = () => {
    inputFile.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file === undefined) {
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
      var image = new Image();
      image.src = e.target.result;
      image.onload = function () {
        var height = this.height;
        var width = this.width;
        if (height < 5 || width < 5) {
          alert(
            'Image is too small, minimum size is 5x5. Given size is ' +
              width +
              'x' +
              height
          );
          return;
        }
        if (height > 128 || width > 128) {
          alert(
            'Image is too large, maximum size is 128x128. Given size is ' +
              width +
              'x' +
              height
          );
          return;
        }

        const [paletteImage, colorIds] = imageToPalette(image);
        // TODO: Upload to backend and get template hash back
        let stencilImage = {
          image: paletteImage,
          width: width,
          height: height
        };
        props.setStencilImage(stencilImage);
        props.setStencilColorIds(colorIds);
        props.setStencilCreationMode(true);
        props.setStencilCreationSelected(false);
        props.setActiveTab('Canvas');
      };
    };
  };

  useEffect(() => {
    async function getMyStencils() {
      try {
        const result = await getFavoriteStencilsFn({
          worldId: props.openedWorldId,
          page: myStencilsPagination.page,
          pageLength: myStencilsPagination.pageLength,
          queryAddress: props.queryAddress
        });

        if (result.data) {
          if (myStencilsPagination.page === 1) {
            setFavoriteStencils(result.data);
          } else {
            setFavoriteStencils([...favoriteStencils, ...result.data]);
          }
        }
      } catch (error) {
        console.log('Error fetching Stencils', error);
      }
    }
    getMyStencils();
  }, [
    props.queryAddress,
    myStencilsPagination.page,
    myStencilsPagination.pageLength
  ]);

  const [expanded, setExpanded] = useState(false);
  const filters = ['hot', 'new', 'top'];
  const [activeFilter, setActiveFilter] = useState(filters[0]);

  useEffect(() => {
    if (!expanded) {
      return;
    }
    async function getStencils() {
      try {
        let result;
        if (activeFilter === 'hot') {
          result = await getHotStencilsFn({
            worldId: props.openedWorldId,
            page: allStencilsPagination.page,
            pageLength: allStencilsPagination.pageLength,
            queryAddress: props.queryAddress
          });
        } else if (activeFilter === 'new') {
          result = await getNewStencilsFn({
            worldId: props.openedWorldId,
            page: allStencilsPagination.page,
            pageLength: allStencilsPagination.pageLength,
            queryAddress: props.queryAddress
          });
        } else if (activeFilter === 'top') {
          result = await getTopStencilsFn({
            worldId: props.openedWorldId,
            page: allStencilsPagination.page,
            pageLength: allStencilsPagination.pageLength,
            queryAddress: props.queryAddress
          });
        } else {
          result = await getStencilsFn({
            worldId: props.openedWorldId,
            page: allStencilsPagination.page,
            pageLength: allStencilsPagination.pageLength,
            queryAddress: props.queryAddress
          });
        }

        console.log('result', result);
        if (result.data) {
          if (allStencilsPagination.page === 1) {
            setAllStencils(result.data);
          } else {
            const newStencils = result.data.filter(
              (stencil) =>
                !allStencils.some(
                  (existingStencil) => existingStencil.id === stencil.id
                )
            );
            setAllStencils([...allStencils, ...newStencils]);
          }
        }
      } catch (error) {
        console.log('Error fetching Stencils', error);
      }
    }
    getStencils();
  }, [props.queryAddress, expanded, allStencilsPagination]);

  const resetPagination = () => {
    setAllStencilsPagination((prev) => ({
      ...prev,
      page: 1
    }));
  };

  useEffect(() => {
    resetPagination();
  }, [activeFilter]);

  const [activeStencil, setActiveStencil] = useState(null);
  useEffect(() => {
    const getStencil = async () => {
      const getStencilPath = `get-stencil?stencilId=${props.openedStencilId}`;
      const response = await fetchWrapper(getStencilPath);
      if (!response.data) {
        return;
      }
      setActiveStencil(response.data);
    };
    if (!props.openedStencilId) {
      return;
    }
    getStencil();
  }, [props.openedStencilId]);

  const updateFavorites = (stencilId, favorites, favorited) => {
    let newFavoriteStencils = favoriteStencils.map((stencil) => {
      if (stencil.stencilId === stencilId) {
        return { ...stencil, favorites: favorites, favorited: favorited };
      }
      return stencil;
    });

    let newAllStencils = allStencils.map((stencil) => {
      if (stencil.stencilId === stencilId) {
        return { ...stencil, favorites: favorites, favorited: favorited };
      }
      return stencil;
    });

    setFavoriteStencils(newFavoriteStencils);
    setAllStencils(newAllStencils);
  };

  return (
    <ExpandableTab
      title='Stencils'
      mainSection={StencilsMainSection}
      expandedSection={StencilsExpandedSection}
      activeStencil={activeStencil}
      openedStencilId={props.openedStencilId}
      setOpenedStencilId={props.setOpenedStencilId}
      address={props.address}
      account={props.account}
      estimateInvokeFee={props.estimateInvokeFee}
      setStencilCreationMode={props.setStencilCreationMode}
      setMyStencilsPagination={setMyStencilsPagination}
      myStencilsPagination={myStencilsPagination}
      allStencils={allStencils}
      setAllStencilsPagination={setAllStencilsPagination}
      allStencilsPagination={allStencilsPagination}
      favoriteStencils={favoriteStencils}
      setFavoriteStencils={setFavoriteStencils}
      updateFavorites={updateFavorites}
      setActiveTab={props.setActiveTab}
      expanded={expanded}
      setExpanded={setExpanded}
      queryAddress={props.queryAddress}
      setAllStencils={setAllStencils}
      activeFilter={activeFilter}
      setActiveFilter={setActiveFilter}
      filters={filters}
      isMobile={props.isMobile}
      gameEnded={props.gameEnded}
      canvasFactoryContract={props.canvasFactoryContract}
      uploadStencil={uploadStencil}
      inputFile={inputFile}
      handleFileChange={handleFileChange}
      setTemplateOverlayMode={props.setTemplateOverlayMode}
      setOverlayTemplate={props.setOverlayTemplate}
    />
  );
};

export default Stencils;
