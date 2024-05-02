import React, { useState } from 'react';
import { encodeToLink } from '../../utils/encodeToLink';
import './QuestItem.css';
import '../../utils/Styles.css';

const QuestItem = (props) => {
  // TODO: Flash red on quest if clicked and not completed w/ no args
  // TODO: Animate form
  const [expanded, setExpanded] = useState(false);
  const expandQuest = () => {
    if (props.status == 'completed') {
      return;
    }

    if (props.args == null || props.args.length == 0) {
      return;
    }

    setExpanded(!expanded);
  };

  const [inputsValidated, setInputsValidated] = useState(false);
  const validateInputs = (event) => {
    if (props.args == null || props.args.length == 0) {
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
      // Switch based on props.args.type[inputIndex]
      if (props.args[inputIndex].inputType == 'address') {
        // Starts w/ 0x and is 65 || 66 characters long
        if (
          !input.value.startsWith('0x') ||
          !(input.value.length == 65 || input.value.length == 66)
        ) {
          console.log('Invalid address');
          validated = false;
        }
        // TODO: Check is hex
      } else if (props.args[inputIndex].inputType == 'text') {
        // Any string < 32 characters
        if (input.value.length >= 32) {
          validated = false;
        }
      } else if (props.args[inputIndex].inputType == 'number') {
        // Any number
        if (isNaN(input.value)) {
          validated = false;
        }
      } else if (props.args[inputIndex].type == 'twitter') {
        // Starts w/ @ and is < 16 characters
        if (!input.value.startsWith('@') || input.value.length >= 16) {
          validated = false;
        }
        // Also check if it's a valid twitter handle
      }
    });

    setInputsValidated(validated);
  };

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
            'QuestItem__progress ' +
            (props.status != 'completed'
              ? 'QuestItem__progress--claimable'
              : '')
          }
        >
          <div
            className={`QuestItem__progression QuestItem__progression--${props.status}`}
            onClick={expandQuest}
          ></div>
          <div className='Text__xsmall QuestItem__reward'>
            +{props.reward}px
          </div>
        </div>
      </div>
      {expanded && (
        <div className='QuestItem__form'>
          <div className='QuestItem__form__seperator'></div>
          {props.args &&
            props.args.map((arg, idx) => (
              <div className='QuestItem__form__item' key={idx}>
                <label className='Text__xsmall QuestItem__form__label'>
                  {arg.label}:&nbsp;
                </label>
                <input
                  type='text'
                  className='Text__small Input__primary QuestItem__form__input'
                  placeholder={arg.placeholder}
                  onChange={validateInputs}
                ></input>
              </div>
            ))}
          {props.args && (
            <button
              className={
                'Button__primary QuestItem__form__submit ' +
                (inputsValidated ? '' : 'Button__disabled')
              }
              onClick={validateInputs}
            >
              Submit
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestItem;
