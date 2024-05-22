import React, { useState, useEffect } from 'react';
import { useContractWrite } from '@starknet-react/core';
import BasicTab from '../BasicTab.js';
import './Voting.css';
import VoteItem from './VoteItem.js';
import {
  fetchWrapper,
  getVotableColors,
  voteColorDevnet
} from '../../services/apiService.js';
import { devnetMode } from '../../utils/Consts.js';

const Voting = (props) => {
  const [userVote, setUserVote] = useState(-1);
  const [votableColorApiState, setVotableColorApiState] = useState({
    loading: false,
    data: null,
    error: ''
  });

  const [calls, setCalls] = useState([]);
  const voteCall = (userVote) => {
    if (devnetMode) return;
    if (!props.address || !props.artPeaceContract) return;
    if (userVote === -1) return;
    setCalls(
      props.artPeaceContract.populateTransaction['vote_color'](userVote)
    );
  };

  useEffect(() => {
    const voteColor = async () => {
      if (devnetMode) return;
      if (calls.length === 0) return;
      await writeAsync();
      console.log('Vote successful:', data, isPending);
      // TODO: Update the UI with the new vote count
    };
    voteColor();
  }, [calls]);

  const { writeAsync, data, isPending } = useContractWrite({
    calls
  });

  useEffect(() => {
    async function fetchUserVote() {
      let getUserVote = await fetchWrapper(
        `get-user-vote?address=${props.queryAddress}`
      );
      if (!getUserVote.data) {
        return;
      }
      setUserVote(getUserVote.data);
    }
    fetchUserVote();
  }, [props.queryAddress]);

  const castVote = async (index) => {
    if (userVote === index) {
      return; // Prevent re-voting for the same index
    }
    if (!devnetMode) {
      setUserVote(index);
      voteCall(index);
      return;
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
