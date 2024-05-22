import React, { useState, useEffect } from 'react';
import {
  useConnect,
  useDisconnect,
  useContractWrite
} from '@starknet-react/core';
import './Account.css';
import BasicTab from '../BasicTab.js';
import '../../utils/Styles.css';
import { backendUrl, devnetMode } from '../../utils/Consts.js';
import { fetchWrapper } from '../../services/apiService.js';
import ColoredIcon from '../../icons/ColoredIcon.js';

const Account = (props) => {
  // TODO: Icons for each rank & buttons
  const [username, setUsername] = useState('');
  const [pixelCount, setPixelCount] = useState(0);
  const [accountRank, setAccountRank] = useState('');

  const [usernameSaved, setUsernameSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [usernameBeforeEdit, setUsernameBeforeEdit] = useState('');
  const [rankColor, setRankColor] = useState('');
  const path =
    'm5.825 21l1.625-7.025L2 9.25l7.2-.625L12 2l2.8 6.625l7.2.625l-5.45 4.725L18.175 21L12 17.275z';

  const toHex = (str) => {
    let hex = '0x';
    for (let i = 0; i < str.length; i++) {
      hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
  };

  const { connect, connectors } = useConnect();
  // TODO: Add disconnect button
  const { _disconnect } = useDisconnect();

  const [addressShort, setAddressShort] = useState('');
  useEffect(() => {
    setAddressShort(
      props.address
        ? `${props.address.slice(0, 6)}...${props.address.slice(-4)}`
        : ''
    );
  }, [props.address]);

  const [calls, setCalls] = useState([]);
  const claimCall = (username) => {
    if (devnetMode) return;
    if (!props.address || !props.usernameContract) return;
    if (username === '') return;
    setCalls(
      props.usernameContract.populateTransaction['claim_username'](
        toHex(username)
      )
    );
  };
  const changeCall = (username) => {
    if (devnetMode) return;
    if (!props.address || !props.usernameContract) return;
    if (username === '') return;
    setCalls(
      props.usernameContract.populateTransaction['change_username'](
        toHex(username)
      )
    );
  };

  useEffect(() => {
    const usernameCall = async () => {
      if (devnetMode) return;
      if (calls.length === 0) return;
      await writeAsync();
      console.log('Username call successful:', data, isPending);
      // TODO: Update the UI with the new vote count
    };
    usernameCall();
  }, [calls]);

  const { writeAsync, data, isPending } = useContractWrite({
    calls
  });

  // TODO: Pending & ... options for edit
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!devnetMode) {
      setUsername(username.trim());
      if (usernameBeforeEdit === '') {
        claimCall(username.trim());
      } else {
        changeCall(username.trim());
      }
      setUsernameSaved(true);
      setIsEditing(false);
      setUsernameBeforeEdit('');
      return;
    }
    // TODO: Check hex felt on backend as well
    // Convert string username to hex bytes utf-8
    let usernameResponse;
    if (usernameBeforeEdit === '') {
      usernameResponse = await fetchWrapper('new-username-devnet', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          username: toHex(username)
        })
      });
    } else {
      usernameResponse = await fetchWrapper('change-username-devnet', {
        mode: 'cors',
        method: 'POST',
        body: JSON.stringify({
          username: toHex(username)
        })
      });
    }
    if (usernameResponse.result) {
      // TODO: Only change if tx is successful
      setUsername(username);
      setUsernameSaved(true);
      setIsEditing(false);
      setUsernameBeforeEdit('');
      console.log(usernameResponse.result);
    } else {
      setUsername(usernameBeforeEdit);
      setUsernameSaved(false);
      setIsEditing(false);
      setUsernameBeforeEdit('');
    }
  };

  const editUsername = () => {
    setIsEditing(true);
    setUsernameBeforeEdit(username);
  };

  const handleCancelEdit = () => {
    setUsername(usernameBeforeEdit);
    setIsEditing(false);
    setUsernameBeforeEdit('');
  };

  useEffect(() => {
    const getUsernameUrl = `get-username?address=${props.queryAddress}`;
    async function fetchUsernameUrl() {
      const result = await fetchWrapper(getUsernameUrl);
      if (result.data === null || result.data === '') {
        setUsername('');
        setUsernameSaved(false);
      } else {
        setUsername(result.data);
        setUsernameSaved(true);
      }
    }
    fetchUsernameUrl();
  }, [props.queryAddress]);

  useEffect(() => {
    const fetchPixelCount = async () => {
      const getPixelCountUrl = `${backendUrl}/get-pixel-count?address=${props.queryAddress}`;
      const response = await fetch(getPixelCountUrl);
      if (response.ok) {
        const result = await response.json();
        setPixelCount(result.data);
      } else {
        console.error('Failed to fetch pixel count:', await response.text());
      }
    };

    fetchPixelCount();
  }, [props.queryAddress]);

  useEffect(() => {
    if (pixelCount >= 50) {
      setAccountRank('Alpha Wolf');
      setRankColor('#B9F2FF');
    } else if (pixelCount >= 30) {
      setAccountRank('Degen Artist');
      setRankColor('#FFAA00');
    } else if (pixelCount >= 10) {
      setAccountRank('Pixel Sensei');
      setRankColor('#C0C0C0');
    } else {
      setAccountRank('Art Beggar');
      setRankColor('#CD7F32');
    }
  }, [pixelCount]);

  const [starknetWalletMode, setStarknetWalletMode] = useState(false);
  const connectStarknetWallet = async () => {
    setStarknetWalletMode(true);
  };

  // TODO: Ethereum login
  // TODO: Add a shimmer effect to the rank icon

  // TODO: Space between account info fields
  return (
    <BasicTab
      title='Account'
      queryAddress={props.queryAddress}
      setActiveTab={props.setActiveTab}
    >
      {props.queryAddress === '0' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div className='Account__login'>
            <div
              className='Text__small Button__primary'
              onClick={connectStarknetWallet}
            >
              StarkNet Login
            </div>
            <div className='Text__small Button__primary'>Ethereum Login</div>
          </div>
          <div
            className={
              'Account__wallet__select' +
              (starknetWalletMode ? ' Account__wallet__select--expanded' : '')
            }
          >
            <div className='Account__walletmode__separator'></div>
            <div className='Account__walletmode__connect'>
              {connectors.map((connector) => {
                return (
                  <button
                    className='Text__small Button__primary'
                    key={connector.id}
                    onClick={() => connect({ connector })}
                  >
                    {connector.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {props.queryAddress !== '0' && (
        <div>
          <h2 className='Text__medium Heading__sub Account__subheader'>Info</h2>
          <p className='Text__small Account__item Account__address'>
            Address: {addressShort}
          </p>
          {devnetMode && (
            <p className='Text__small Account__item Account__address'>
              Devnet Mode: {props.queryAddress.slice(0, 6)}...
            </p>
          )}
          {usernameSaved && !isEditing ? (
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
                <div>
                  {isEditing && (
                    <button
                      className='Text__small Button__primary Account__username__button'
                      onClick={handleCancelEdit}
                      type='button'
                    >
                      cancel
                    </button>
                  )}
                  <button
                    className='Text__small Button__primary Account__username__button'
                    type='submit'
                  >
                    submit
                  </button>
                </div>
              </form>
            </div>
          )}
          <p className='Text__small Account__item'>
            Network: {props.chain.network.toUpperCase()}
          </p>

          <h2 className='Text__medium Heading__sub Account__subheader'>
            Stats
          </h2>
          <p className='Text__small Account__item'>
            Pixels placed: {pixelCount}
          </p>
          <p className='Text__small Account__item'>
            Rank: {accountRank}
            <ColoredIcon
              width='3rem'
              color={rankColor}
              path={path}
              style={{ marginLeft: '0.5rem' }}
            />
          </p>
        </div>
      )}
    </BasicTab>
  );
};

export default Account;
