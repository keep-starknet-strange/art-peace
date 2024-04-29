import React, { useState, useEffect } from 'react';
import BasicTab from '../BasicTab.js';
import './Voting.css';
import VoteItem from './VoteItem.js';
import { getVotableColors } from '../../services/apiService.js';

const Voting = (props) => {
  const [userVote, setUserVote] = useState(-1);

  const castVote = (index) => {
    // TODO: Implement the logic to cast a vote
    /*
    if (userVote === index) {
      return;
    }
    let newVotes = [...votes];
    if (userVote !== -1) {
      newVotes[userVote]--;
    }
    newVotes[index]++;
    setVotes(newVotes);
    */
    setUserVote(index);
    console.log('Voting for color with index:', index);
  };

  // VotableColor API
  const [votableColorApiState, setVotableColorApiState] = useState({
    loading: null,
    error: '',
    data: null
  });
  useEffect(() => {
    const fetchVotableColoers = async () => {
      try {
        setVotableColorApiState((prevState) => ({
          ...prevState,
          loading: true
        }));
        const result = await getVotableColors();
        // Sort by votes
        let votableColors = result.data;
        votableColors.sort((a, b) => b.votes - a.votes);
        setVotableColorApiState((prevState) => ({
          ...prevState,
          data: votableColors,
          loading: false
        }));
      } catch (error) {
        // Handle or log the error as needed
        setVotableColorApiState((prevState) => ({
          ...prevState,
          error,
          loading: false
        }));
        console.error('Error fetching votable colors:', error);
      }
    };
    fetchVotableColoers();
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
              index={index}
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
