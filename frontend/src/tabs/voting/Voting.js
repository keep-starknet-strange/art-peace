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

// TODO: Other voting options: best nft, best community, etc.
// TODO: No vote while loading get-user-vote
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
    if (props.queryAddress === '0') {
      return; // Prevent voting if not logged in
    }
    if (userVote === index) {
      return; // Prevent re-voting for the same index
    }
    if (!devnetMode) {
      voteCall(index);
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
    if (props.isLastDay || props.gameEnded) {
      setVotableColorApiState((prevState) => ({
        ...prevState,
        data: []
      }));
      return;
    }
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
  }, [props.isLastDay, props.gameEnded]);

  return (
    <BasicTab title='Voting' setActiveTab={props.setActiveTab}>
      {props.isLastDay && !props.gameEnded && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.4rem'
            }}
          >
            <p className='Text__medium'>Voting has ended</p>
            <p
              className={`Text__small Voting__timer ${props.newDayAvailable ? 'Voting__timer--active' : ''}`}
              onClick={() => props.startNextDay()}
            >
              {props.timeLeftInDay}
            </p>
          </div>
        </div>
      )}
      {!props.isLastDay && !props.gameEnded && (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '0rem 1rem'
            }}
          >
            <p className='Text__medium'>Time left to vote</p>
            <p
              className={`Text__small Voting__timer ${props.newDayAvailable ? 'Voting__timer--active' : ''}`}
              onClick={() => props.startNextDay()}
            >
              {props.timeLeftInDay}
            </p>
          </div>
          <p className='Text__small Voting__description'>
            {props.queryAddress === '0'
              ? 'Please login with your wallet to vote'
              : 'Vote for a new palette color'}
          </p>

          <div className='Voting__grid'>
            {votableColorApiState.data && votableColorApiState.data.length ? (
              votableColorApiState.data.map((color, index) => (
                <VoteItem
                  key={index}
                  queryAddress={props.queryAddress}
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
        </div>
      )}
    </BasicTab>
  );
};

export default Voting;
