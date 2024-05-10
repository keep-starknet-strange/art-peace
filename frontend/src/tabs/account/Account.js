import React, { useState, useEffect } from 'react';
import { connect } from 'get-starknet';
import './Account.css';
import BasicTab from '../BasicTab.js';
import '../../utils/Styles.css';
import { backendUrl, devnetMode } from '../../utils/Consts.js';
import { fetchWrapper } from '../../services/apiService.js';

const Account = (props) => {
  // TODO: Icons for each rank & buttons
  // TODO: Button to cancel username edit
  const [username, setUsername] = useState('');
  const [pixelCount, setPixelCount] = useState(0);
  const [accountRank, setAccountRank] = useState('');

  const [usernameSaved, setUsernameSaved] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const newUsernameResponse = fetchWrapper('new-username-devnet', {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        username: username
      })
    });
    if (newUsernameResponse.result) {
      // TODO: Only change if tx is successful
      setUsername(username);
      setUsernameSaved(true);
      console.log(newUsernameResponse.result);
    } else {
      setUsername('');
      setUsernameSaved(false);
    }
  };

  const editUsername = async () => {
    setUsernameSaved(false);
    const updateUsernameResult = await fetchWrapper('change-username-devnet', {
      mode: 'cors',
      method: 'POST',
      body: JSON.stringify({
        username: username
      })
    });
    if (updateUsernameResult.result) {
      setUsername(username);
      setUsernameSaved(true);
      console.log(updateUsernameResult.result);
    } else {
      setUsername('');
      setUsernameSaved(false);
    }
  };

  useEffect(() => {
    const getUsernameUrl = `${backendUrl}/get-username?address=${props.address}`;
    fetch(getUsernameUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch username');
        }
        return res.json();
      })
      .then((result) => {
        if (result.data === null || result.data === '') {
          setUsername('');
          setUsernameSaved(false);
        } else {
          setUsername(result.data);
          setUsernameSaved(true);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch username:', error);
      });
  }, [props.address]);

  useEffect(() => {
    const fetchPixelCount = async () => {
      const getPixelCountUrl = `${backendUrl}/get-pixel-count?address=${props.address}`;
      const response = await fetch(getPixelCountUrl);
      if (response.ok) {
        const result = await response.json();
        setPixelCount(result.data);
      } else {
        console.error('Failed to fetch pixel count:', await response.text());
      }
    };

    fetchPixelCount();
  }, [props.address]);

  useEffect(() => {
    if (pixelCount >= 50) {
      setAccountRank('Alpha Wolf');
    } else if (pixelCount >= 30) {
      setAccountRank('Degen Artist');
    } else if (pixelCount >= 10) {
      setAccountRank('Pixel Sensei');
    } else {
      setAccountRank('Art Beggar');
    }
  }, [pixelCount]);

  const connectWallet = async () => {
    const starknet = await connect();

    let [addr] = await starknet.enable();
    if (devnetMode) {
      // TODO: to lowercase on frontend and/or backend for all hex/address calls
      addr = '328ced46664355fc4b885ae7011af202313056a7e3d44827fb24c9d3206aaa0';
    } else {
      addr = addr.toLowerCase();
      addr = addr.slice(2);
    }
    if (addr && addr.length > 0) {
      props.setupStarknet(addr, starknet);
    }
  };

  // TODO: Ethereum login
  // TODO: Change layout based on if connected or not
  return (
    <BasicTab
      title='Account'
      connected={props.connected}
      address={props.address}
      setupStarknet={props.setupStarknet}
      setActiveTab={props.setActiveTab}
    >
      <h2 className='Text__medium Heading__sub Account__subheader'>Info</h2>
      <div className='Account__login'>
        <div className='Text__small Button__primary' onClick={connectWallet}>
          StarkNet Login
        </div>
        <div className='Text__small Button__primary'>Ethereum Login</div>
      </div>
      <p className='Text__small Account__item Account__address'>
        Address: 0x{props.address}
      </p>
      {usernameSaved ? (
        <div className='Text__small Account__special Account__username'>
          <p style={{ margin: 0, padding: 0 }}>Username: {username}</p>
          <div
            className='Text__small Button__primary Account__username__button'
            onClick={editUsername}
          >
            edit
          </div>
        </div>
      ) : (
        <div>
          <p className='Text__small Account__item'>Username:&nbsp;</p>
          <form
            className='Account__item Account__username__form'
            onSubmit={handleSubmit}
          >
            <input
              className='Text__small Input__primary Account__username__input'
              type='text'
              value={username}
              required
              onChange={(e) => setUsername(e.target.value)}
            />
            <button
              className='Text__small Button__primary Account__username__button'
              type='submit'
            >
              submit
            </button>
          </form>
        </div>
      )}

      <h2 className='Text__medium Heading__sub Account__subheader'>Stats</h2>
      <p className='Text__small Account__item'>Pixels placed: {pixelCount}</p>
      <p className='Text__small Account__item'>Rank: {accountRank}</p>
    </BasicTab>
  );
};

export default Account;
