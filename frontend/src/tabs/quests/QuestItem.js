import React, { useState, useEffect } from 'react';
import { encodeToLink } from '../../utils/encodeToLink';
import './QuestItem.css';
import '../../utils/Styles.css';
import { fetchWrapper } from '../../services/apiService';
import { devnetMode } from '../../utils/Consts.js';

const QuestItem = (props) => {
  // TODO: Flash red on quest if clicked and not completed w/ no args
  const [expanded, setExpanded] = useState(false);
  const [inputsValidated, setInputsValidated] = useState(false);
  const validateInputs = (event) => {
    if (props.claimParams == null || props.claimParams.length == 0) {
      return;
    }

    // select all inputs within this component
    let component = event.target.closest('.QuestItem');
    let inputs = component.querySelectorAll('.QuestItem__form__input');
    let validated = true;
    inputs.forEach((input, inputIndex) => {
      if (input.value == '') {
        validated = false;
      }
      // Switch based on props.claimParams.claimType[inputIndex]
      if (props.claimParams[inputIndex].claimType == 'address') {
        // Starts w/ 0x and is 65 || 66 hex characters long
        let hexPattern = /^0x[0-9a-fA-F]{63,64}$/;
        if (!hexPattern.test(input.value)) {
          validated = false;
        }
      } else if (props.claimParams[inputIndex].claimType == 'text') {
        // Any string < 32 characters
        if (input.value.length >= 32) {
          validated = false;
        }
      } else if (props.claimParams[inputIndex].claimType == 'number') {
        // Any number
        if (isNaN(input.value)) {
          validated = false;
        }
      } else if (props.claimParams[inputIndex].claimType == 'twitter') {
        // Starts w/ @ and is < 16 characters
        if (!input.value.startsWith('@') || input.value.length >= 16) {
          validated = false;
        }
        // Also check if it's a valid twitter handle
      }
    });

    setInputsValidated(validated);
  };

  const claimTodayQuestCall = async (quest_id, calldata) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract || !props.account) return;
    // TODO: Check valid inputs & expand calldata
    const claimQuestCallData = props.artPeaceContract.populate(
      'claim_today_quest',
      {
        quest_id: quest_id,
        calldata: calldata
      }
    );
    const { suggestedMaxFee } = await props.estimateInvokeFee({
      contractAddress: props.artPeaceContract.address,
      entrypoint: 'claim_today_quest',
      calldata: claimQuestCallData.calldata
    });
    /* global BigInt */
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await props.artPeaceContract.claim_today_quest(
      claimQuestCallData.calldata,
      {
        maxFee
      }
    );
    console.log(result);
  };

  const claimMainQuestCall = async (quest_id, calldata) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract || !props.account) return;
    const claimQuestCallData = props.artPeaceContract.populate(
      'claim_main_quest',
      {
        quest_id: quest_id,
        calldata: calldata
      }
    );
    const { suggestedMaxFee } = await props.estimateInvokeFee({
      contractAddress: props.artPeaceContract.address,
      entrypoint: 'claim_main_quest',
      calldata: claimQuestCallData.calldata
    });
    const maxFee = (suggestedMaxFee * BigInt(15)) / BigInt(10);
    const result = await props.artPeaceContract.claim_main_quest(
      claimQuestCallData.calldata,
      {
        maxFee
      }
    );
    console.log(result);
  };

  const [canClaim, setCanClaim] = useState(false);
  const claimOrExpand = async () => {
    if (!canClaim || props.gameEnded || props.queryAddress === '0') {
      return;
    }
    if (props.status == 'completed') {
      return;
    }
    let questCalldata = [];
    if (props.claimParams && props.claimParams.length > 0) {
      if (inputsValidated) {
        let component = event.target.closest('.QuestItem');
        let inputs = component.querySelectorAll('.QuestItem__form__input');
        inputs.forEach((input) => {
          questCalldata.push(input.value);
        });
        setExpanded(!expanded);
      } else if (props.claimParams[0].input) {
        setExpanded(!expanded);
        return;
      }
    }
    // TODO: Bug when token_id is 0
    if (props.calldata) {
      questCalldata = props.calldata;
    }
    if (!devnetMode) {
      if (props.type === 'daily') {
        await claimTodayQuestCall(props.questId, questCalldata);
      } else if (props.type === 'main') {
        await claimMainQuestCall(props.questId, questCalldata);
      } else {
        console.log('Quest type not recognized');
      }
      props.markCompleted(props.questId, props.type);
      return;
    }
    let route = '';
    if (props.type === 'daily') {
      route = 'claim-today-quest-devnet';
    } else if (props.type === 'main') {
      route = 'claim-main-quest-devnet';
    } else {
      console.log('Quest type not recognized');
      return;
    }
    const response = await fetchWrapper(route, {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        questId: props.questId.toString(),
        calldata: questCalldata.length > 0 ? questCalldata[0].toString() : ''
      })
    });
    if (response.result) {
      console.log(response.result);
      props.markCompleted(props.questId, props.type);
    }
  };

  const [percentCompletion, setPercentCompletion] = useState(0);
  const [progressionColor, setProgressionColor] =
    useState('rgba(0, 0, 0, 0.4)');
  useEffect(() => {
    if (!props.needed || props.needed == 0) {
      setPercentCompletion(0);
      if (props.status === 'completed') {
        setProgressionColor('rgba(32, 225, 32, 0.80)');
      } else {
        setProgressionColor('hsla(0, 100%, 60%, 0.78)');
      }
      return;
    }
    let progress = props.progress;
    let percent = Math.floor((progress / props.needed) * 100);
    if (percent >= 100) {
      percent = 100;
    } else if (percent <= 0) {
      percent = 0;
    } else if (percent < 8) {
      // Minimum width for progress bar
      percent = 8;
    } else if (percent > 92) {
      // Maximum width for progress bar
      percent = 92;
    }
    if (props.status === 'completed') {
      setProgressionColor('rgba(32, 225, 32, 0.80)');
    } else if (
      props.claimParams &&
      props.claimParams.length > 0 &&
      props.claimParams[0].input
    ) {
      setProgressionColor(`hsla(${0.5 * 60}, 100%, 60%, 0.78)`);
    } else {
      setProgressionColor(`hsla(${(percent / 100) * 60}, 100%, 60%, 0.78)`);
    }
    setPercentCompletion(percent);
  }, [props.progress, props.needed, props.status]);

  useEffect(() => {
    if (props.gameEnded || props.queryAddress === '0') {
      setCanClaim(false);
      return;
    }
    if (props.status === 'completed') {
      setCanClaim(false);
      return;
    }
    if (props.claimParams && props.claimParams.length > 0) {
      if (props.claimParams[0].input) {
        setCanClaim(true);
      } else {
        setCanClaim(props.progress >= props.needed);
      }
      return;
    }
    setCanClaim(props.progress >= props.needed);
  }, [props]);

  // TODO: Claimable if progress >= needed
  // TODO: 100% to the top of list
  return (
    <div
      className={
        'QuestItem ' + (props.status == 'completed' ? 'QuestItem--done ' : '')
      }
    >
      <div className='QuestItem__main'>
        <div className='QuestItem__info'>
          <p className='Text__small QuestItem__info__title'>{props.title}</p>
          <p
            dangerouslySetInnerHTML={encodeToLink(props.description)}
            className='Text__xsmall QuestItem__info__desc'
          ></p>
        </div>
        <div
          className={
            'QuestItem__button ' +
            (canClaim ? 'QuestItem__button--claimable ' : '') +
            (percentCompletion == 100 && props.status !== 'completed'
              ? 'QuestItem__button--pulsate '
              : '')
          }
          onClick={claimOrExpand}
        >
          <div className='QuestItem__button__progress'>
            <div
              className='QuestItem__button__progression'
              style={{
                width: `${percentCompletion === 0 || props.status === 'completed' ? 100 : percentCompletion}%`,
                backgroundColor: progressionColor
              }}
            ></div>
          </div>
          <div className='Text__xsmall QuestItem__reward'>
            +{props.reward}px
          </div>
        </div>
      </div>
      <div
        className={
          'QuestItem__form' + (expanded ? ' QuestItem__form--expanded' : '')
        }
      >
        <div className='QuestItem__form__seperator'></div>
        {props.claimParams &&
          props.claimParams.map((arg, idx) => (
            <div className='QuestItem__form__item' key={idx}>
              <label className='Text__xsmall QuestItem__form__label'>
                {arg.name}:&nbsp;
              </label>
              <input
                type='text'
                className='Text__small Input__primary QuestItem__form__input'
                placeholder={arg.example}
                onChange={validateInputs}
              ></input>
            </div>
          ))}
        {props.claimParams && (
          <button
            className={
              'Button__primary QuestItem__form__submit ' +
              (inputsValidated ? '' : 'Button__disabled')
            }
            onClick={claimOrExpand}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestItem;
