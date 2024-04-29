import React, { useState } from 'react';
import BasicTab from '../BasicTab.js';
import './Voting.css';
import VoteItem from './VoteItem.js';

const Voting = (props) => {
  // TODO: Pull from API
  const colors = [
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#00FFFF',
    '#FF00FF',
    '#FFFFFF',
    '#808080',
    '#C0C0C0',
    '#800000',
    '#808000',
    '#008000',
    '#800080',
    '#008080',
    '#000000'
  ];
  const colorVotes = colors.map(() => Math.floor(Math.random() * 10000));

  const [votes, setVotes] = useState(colorVotes);
  const [userVote, setUserVote] = useState(-1);

  const castVote = (index) => {
    if (userVote === index) {
      return;
    }
    let newVotes = [...votes];
    if (userVote !== -1) {
      newVotes[userVote]--;
    }
    setUserVote(index);
    newVotes[index]++;
    setVotes(newVotes);
  };

  return (
    <BasicTab title='Voting' setActiveTab={props.setActiveTab}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <p className='Text__small Voting__description'>Vote close:</p>
        <p className='Text__small Voting__timer'>{props.timeLeftInDay}</p>
      </div>
      <p className='Text__small Voting__description'>
        Vote to add to the color palette.
      </p>

      <div className='Voting__grid'>
        {colors.map((color, index) => (
          <VoteItem
            key={index}
            color={color}
            votes={votes[index]}
            castVote={castVote}
            index={index}
            userVote={userVote}
          />
        ))}
      </div>
    </BasicTab>
  );
};

export default Voting;
