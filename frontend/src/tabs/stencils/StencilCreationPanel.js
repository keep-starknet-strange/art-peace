import React from 'react';
import './StencilCreationPanel.css';
import { fetchWrapper } from '../../services/apiService.js';
import { devnetMode } from '../../utils/Consts.js';
import { sha256 } from 'js-sha256';

const StencilCreationPanel = (props) => {
  // TODO: Arrows to control position and size
  const closePanel = () => {
    props.setStencilCreationMode(false);
    props.setStencilCreationSelected(false);
    props.setStencilImage(null);
    props.setStencilColorIds([]);
  };

  const addStencilCall = async (worldId, hash, position, width, height) => {
    if (devnetMode) return;
    if (!props.address || !props.canvasFactoryContract || !props.account)
      return;
    // TODO: Validate the position, width, and height
    console.log('Adding Stencil:', position, width, height);
    let addStencilParams = {
      world_id: worldId,
      hash: hash,
      width: width,
      height: height,
      position: position
    };
    const addStencilCalldata = props.canvasFactoryContract.populate(
      'add_stencil',
      {
        stencil_metadata: addStencilParams
      }
    );
    const { suggestedMaxFee } = await props.estimateInvokeFee({
      contractAddress: props.canvasFactoryContract.address,
      entrypoint: 'add_stencil',
      calldata: addStencilCalldata.calldata
    });
    /* global BigInt */
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await props.canvasFactoryContract.add_stencil(
      addStencilCalldata.calldata,
      {
        maxFee
      }
    );
    console.log(result);
    // TODO: Check if the transaction is successful
    let addStencilImageEndpoint = 'add-stencil-data';
    const addResponse = await fetchWrapper(addStencilImageEndpoint, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        worldId: worldId.toString(),
        width: props.stencilImage.width.toString(),
        height: props.stencilImage.height.toString(),
        image: props.stencilColorIds.toString()
      })
    });
    if (addResponse.result) {
      // TODO: Double check hash match
      // TODO: Update UI optimistically & go to specific faction in factions tab
      console.log('Stencil added to backend with hash: ', addResponse.result);
      closePanel();
      props.setActiveTab('Stencils');
      return;
    }
  };

  const hashStencilImage = () => {
    // TODO: Change hash to Poseidon
    let hash = sha256(props.stencilColorIds).slice(2);
    return '0x' + hash;
  };

  const submit = async () => {
    let hash = hashStencilImage();
    if (!devnetMode) {
      await addStencilCall(
        props.worldId,
        hash,
        props.stencilPosition,
        props.stencilImage.width,
        props.stencilImage.height
      );
      return;
    }
    let addStencilEndpoint = 'add-stencil-devnet';
    const response = await fetchWrapper(addStencilEndpoint, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        worldId: props.worldId.toString(),
        hash: hash,
        width: props.stencilImage.width.toString(),
        height: props.stencilImage.height.toString(),
        position: props.stencilPosition.toString()
      })
    });
    if (response.result) {
      console.log(response.result);
      let addTemplateImageEndpoint = 'add-stencil-data';
      const addResponse = await fetchWrapper(addTemplateImageEndpoint, {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          worldId: props.worldId.toString(),
          width: props.stencilImage.width.toString(),
          height: props.stencilImage.height.toString(),
          image: props.stencilColorIds.toString()
        })
      });
      if (addResponse.result) {
        props.setOverlayTemplate({
          hash: hash,
          width: props.stencilImage.width,
          height: props.stencilImage.height,
          image: props.stencilImage.image,
          isStencil: true
        });
        props.setTemplateOverlayMode(true);
        closePanel();
        props.setActiveTab('Canvas');
      }
      return;
    }
  };

  return (
    <div className='StencilCreationPanel'>
      {props.activeWorld && props.stencilImage && (
        <div>
          <p
            className='Button__close StencilCreationPanel__close'
            onClick={() => closePanel()}
          >
            X
          </p>
          <div className='StencilCreationPanel__header'>
            <p className='Text__medium Heading__sub'>
              New &quot;{props.activeWorld.name}&quot; stencil
            </p>
          </div>
          <div className='StencilCreationPanel__notes'>
            {props.stencilCreationSelected === false && (
              <p
                className='Text__xsmall'
                style={{
                  margin: '0.5rem',
                  padding: '0'
                }}
              >
                Select a location for the new stencil...
              </p>
            )}
            {props.stencilCreationSelected && (
              <p
                className='Text__xsmall'
                style={{
                  margin: '0.5rem',
                  padding: '0'
                }}
              >
                Confirm and submit the new stencil...
              </p>
            )}
          </div>
          <div className='StencilCreationPanel__body'>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                flexWrap: 'wrap'
              }}
            >
              <div className='StencilCreationPanel__item'>
                <p className='Text__small Heading__sub'>Position</p>
                <p className='Text__small StencilCreationPanel__item__text'>
                  ({props.stencilPosition % props.canvasWidth},
                  {Math.floor(props.stencilPosition / props.canvasWidth)})
                </p>
              </div>
              <div className='StencilCreationPanel__item'>
                <p className='Text__small Heading__sub'>Size</p>
                <p className='Text__small StencilCreationPanel__item__text'>
                  {props.stencilImage.width} x {props.stencilImage.height}
                </p>
              </div>
            </div>
          </div>
          <div className='StencilCreationPanel__form'>
            <div className='StencilCreationPanel__form__buttons'>
              <div
                className='Button__primary StencilCreationPanel__button'
                onClick={() => closePanel()}
              >
                Cancel
              </div>
              <div
                className={`Button__primary StencilCreationPanel__button ${!props.stencilCreationSelected ? 'Button__disabled' : ''}`}
                onClick={() => submit()}
              >
                Submit
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StencilCreationPanel;
