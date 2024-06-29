import React from 'react';
import './VoteItem.css';

const VoteItem = (props) => {
  return (
    <div className='VoteItem'>
      <div
        className={`Button__primary VoteItem__vote ${props.queryAddress === '0' ? 'Button__disabled' : ''}`}
        onClick={() => props.castVote(props.index)}
      >
        {props.userVote === props.index && (
          <div className='VoteItem__vote__mark'>x</div>
        )}
      </div>

      <div
        className='VoteItem__color'
        style={{ backgroundColor: props.color }}
      ></div>
      <div className='VoteItem__votes'>{props.votes}</div>
    </div>
  );
};

export default VoteItem;
