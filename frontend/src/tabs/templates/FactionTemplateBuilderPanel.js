import React from 'react';
import './FactionTemplateBuilderPanel.css';
import canvasConfig from '../../configs/canvas.config.json';
import { fetchWrapper } from '../../services/apiService.js';
import { devnetMode } from '../../utils/Consts.js';
import { sha256 } from 'js-sha256';

const FactionTemplateBuilderPanel = (props) => {
  // TODO: Arrows to control position and size
  const closePanel = () => {
    props.setTemplateCreationMode(false);
    props.setTemplateCreationSelected(false);
    props.setTemplateImage(null);
    props.setTemplateColorIds([]);
    props.setTemplateFaction(null);
  };

  const addFactionTemplateCall = async (
    factionId,
    hash,
    position,
    width,
    height
  ) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract || !props.account) return;
    // TODO: Validate the position, width, and height
    console.log('Adding Faction Template:', position, width, height);
    let addTemplateParams = {
      faction_id: factionId,
      hash: hash,
      position: position,
      width: width,
      height: height
    };
    const addFactionTemplateCallData = props.artPeaceContract.populate(
      'add_faction_template',
      {
        template_metadata: addTemplateParams
      }
    );
    const { suggestedMaxFee } = await props.estimateInvokeFee({
      contractAddress: props.artPeaceContract.address,
      entrypoint: 'add_faction_template',
      calldata: addFactionTemplateCallData.calldata
    });
    /* global BigInt */
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await props.artPeaceContract.add_faction_template(
      addFactionTemplateCallData.calldata,
      {
        maxFee
      }
    );
    console.log(result);
    // TODO: Check if the transaction is successful
    let addTemplateImageEndpoint = 'add-template-data';
    const addResponse = await fetchWrapper(addTemplateImageEndpoint, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        width: props.templateImage.width.toString(),
        height: props.templateImage.height.toString(),
        image: props.templateColorIds.toString()
      })
    });
    if (addResponse.result) {
      // TODO: after tx done, add template to backend
      // TODO: Double check hash match
      // TODO: Update UI optimistically & go to specific faction in factions tab
      console.log('Template added to backend with hash: ', addResponse.result);
      closePanel();
      props.setActiveTab('Factions');
      return;
    }
  };

  const addChainFactionTemplateCall = async (
    factionId,
    hash,
    position,
    width,
    height
  ) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract || !props.account) return;
    console.log('Adding Chain Faction Template:', position, width, height);
    let addTemplateParams = {
      faction_id: factionId,
      hash: hash,
      position: position,
      width: width,
      height: height
    };
    const addChainFactionTemplateCallData = props.artPeaceContract.populate(
      'add_chain_faction_template',
      {
        template_metadata: addTemplateParams
      }
    );
    const { suggestedMaxFee } = await props.estimateInvokeFee({
      contractAddress: props.artPeaceContract.address,
      entrypoint: 'add_chain_faction_template',
      calldata: addChainFactionTemplateCallData.calldata
    });
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await props.artPeaceContract.add_chain_faction_template(
      addChainFactionTemplateCallData.calldata,
      {
        maxFee
      }
    );
    console.log(result);
    let addTemplateImageEndpoint = 'add-template-data';
    const addResponse = await fetchWrapper(addTemplateImageEndpoint, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        width: props.templateImage.width.toString(),
        height: props.templateImage.height.toString(),
        image: props.templateColorIds.toString()
      })
    });
    if (addResponse.result) {
      console.log('Template added to backend with hash: ', addResponse.result);
      closePanel();
      props.setActiveTab('Factions');
      return;
    }
  };

  const hashStencilImage = () => {
    // TODO: Change hash to Poseidon
    let hash = sha256(props.templateColorIds).slice(2);
    return '0x' + hash;
  };

  const submit = async () => {
    let hash = hashStencilImage();
    if (!devnetMode) {
      if (props.templateFaction.isChain) {
        await addChainFactionTemplateCall(
          props.templateFaction.factionId,
          hash,
          props.templatePosition,
          props.templateImage.width,
          props.templateImage.height
        );
      } else {
        await addFactionTemplateCall(
          props.templateFaction.factionId,
          hash,
          props.templatePosition,
          props.templateImage.width,
          props.templateImage.height
        );
      }
      return;
    }
    let addFactionTemplateEndpoint = props.templateFaction.isChain
      ? 'add-chain-faction-template-devnet'
      : 'add-faction-template-devnet';
    const response = await fetchWrapper(addFactionTemplateEndpoint, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        factionId: props.templateFaction.factionId.toString(),
        hash: hash,
        position: props.templatePosition.toString(),
        width: props.templateImage.width.toString(),
        height: props.templateImage.height.toString()
      })
    });
    if (response.result) {
      console.log(response.result);
      let addTemplateImageEndpoint = 'add-template-data';
      const addResponse = await fetchWrapper(addTemplateImageEndpoint, {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          width: props.templateImage.width.toString(),
          height: props.templateImage.height.toString(),
          image: props.templateColorIds.toString()
        })
      });
      if (addResponse.result) {
        // TODO: after tx done, add template to backend
        // TODO: Double check hash match
        // TODO: Update UI optimistically & go to specific faction in factions tab
        console.log(addResponse.result);
        closePanel();
        props.setActiveTab('Factions');
      }
      return;
    }
  };

  return (
    <div className='FactionTemplateBuilderPanel'>
      {props.templateFaction &&
        props.templateImage &&
        props.templatePosition && (
          <div>
            <p
              className='Button__close FactionTemplateBuilderPanel__close'
              onClick={() => closePanel()}
            >
              X
            </p>
            <div className='FactionTemplateBuilderPanel__header'>
              <p className='Text__medium Heading__sub'>
                New &quot;{props.templateFaction.name}&quot; stencil
              </p>
            </div>
            <div className='FactionTemplateBuilderPanel__notes'>
              {props.templateCreationSelected === false && (
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
              {props.templateCreationSelected && (
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
            <div className='FactionTemplateBuilderPanel__body'>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap'
                }}
              >
                <div className='FactionTemplateBuilderPanel__item'>
                  <p className='Text__small Heading__sub'>Position</p>
                  <p className='Text__small FactionTemplateBuilderPanel__item__text'>
                    ({props.templatePosition % canvasConfig.canvas.width},
                    {Math.floor(
                      props.templatePosition / canvasConfig.canvas.width
                    )}
                    )
                  </p>
                </div>
                <div className='FactionTemplateBuilderPanel__item'>
                  <p className='Text__small Heading__sub'>Size</p>
                  <p className='Text__small FactionTemplateBuilderPanel__item__text'>
                    {props.templateImage.width} x {props.templateImage.height}
                  </p>
                </div>
              </div>
            </div>
            <div className='FactionTemplateBuilderPanel__form'>
              <div className='FactionTemplateBuilderPanel__form__buttons'>
                <div
                  className='Button__primary FactionTemplateBuilderPanel__button'
                  onClick={() => closePanel()}
                >
                  Cancel
                </div>
                <div
                  className={`Button__primary FactionTemplateBuilderPanel__button ${
                    !props.templateCreationSelected ? 'Button__disabled' : ''
                  }`}
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

export default FactionTemplateBuilderPanel;
