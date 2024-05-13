import React, { useState, useEffect } from 'react';
import BasicTab from '../BasicTab.js';
import './Voting.css';
import VoteItem from './VoteItem.js';
import {
  getVotableColors,
  voteColorDevnet
} from '../../services/apiService.js';

const Voting = (props) => {
  const [userVote, setUserVote] = useState(-1);
  const [votableColorApiState, setVotableColorApiState] = useState({
    loading: false,
    data: null,
    error: ''
  });

  const castVote = async (index) => {
    if (userVote === index) {
      return; // Prevent re-voting for the same index
    }
    try {
      const result = await voteColorDevnet(index);
      if (result.result) {
        console.log('Vote successful:', result.result);
        const oldColorIdx = votableColorApiState.data.findIndex(
          (idx) => idx.key === userVote
        );
        const colorIdx = votableColorApiState.data.findIndex(
          (idx) => idx.key === index
        );
        if (oldColorIdx !== -1) {
          votableColorApiState.data[oldColorIdx].votes--;
        }
        votableColorApiState.data[colorIdx].votes++;
        setUserVote(index);
      } else {
        throw new Error(result.error || 'Failed to vote');
      }
    } catch (error) {
      console.error('Error voting for color:', error);
    }
  };

  useEffect(() => {
    const fetchVotableColors = async () => {
      try {
        setVotableColorApiState((prevState) => ({
          ...prevState,
          loading: true
        }));
        const result = await getVotableColors();
        let votableColors = result.data;
        votableColors.sort((a, b) => b.votes - a.votes);
        setVotableColorApiState((prevState) => ({
          ...prevState,
          data: votableColors,
          loading: false
        }));
      } catch (error) {
        setVotableColorApiState((prevState) => ({
          ...prevState,
          error,
          loading: false
        }));
        console.error('Error fetching votable colors:', error);
      }
    };
    fetchVotableColors();
  }, []);

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
        {votableColorApiState.data && votableColorApiState.data.length ? (
          votableColorApiState.data.map((color, index) => (
            <VoteItem
              key={index}
              color={`#${color.hex}FF`}
              votes={color.votes}
              castVote={castVote}
              index={color.key}
              userVote={userVote}
            />
          ))
        ) : (
          <div style={{ padding: '1.4rem', textAlign: 'center' }}>
            No Color Added Yet
          </div>
        )}
      </div>
    </BasicTab>
  );
};

export default Voting;
