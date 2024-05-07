import React, { useState, useEffect } from 'react';
import './Account.css';
import BasicTab from '../BasicTab.js';
import '../../utils/Styles.css';
import { backendUrl } from '../../utils/Consts.js';

const Account = (props) => {
  // TODO: Icons for each rank & buttons
  // TODO: Button to cancel username edit
  const [address, _setAddress] = useState(
    '0x0000000000000000000000000000000000000000000000000000000000000000'
  );
  const [username, setUsername] = useState('');
  const [pixelCount, setPixelCount] = useState(0);
  const [accountRank, setAccountRank] = useState('');

  const [usernameSaved, setUsernameSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [usernameBeforeEdit, setUsernameBeforeEdit] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setUsername(username);
    setUsernameSaved(true);
    setIsEditing(false);
    setUsernameBeforeEdit('');
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
    const getUsernameUrl = `${backendUrl}/get-username?address=${address}`;
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
  }, [address]);

  useEffect(() => {
    const fetchPixelCount = async () => {
      const getPixelCountUrl = `${backendUrl}/get-pixel-count?address=${address}`;
      const response = await fetch(getPixelCountUrl);
      if (response.ok) {
        const result = await response.json();
        setPixelCount(result.data);
      } else {
        console.error('Failed to fetch pixel count:', await response.text());
      }
    };

    fetchPixelCount();
  }, [address]);

  useEffect(() => {
    if (pixelCount >= 5000) {
      setAccountRank('Champion');
    } else if (pixelCount >= 3000) {
      setAccountRank('Platinum');
    } else if (pixelCount >= 2000) {
      setAccountRank('Gold');
    } else if (pixelCount >= 1000) {
      setAccountRank('Silver');
    } else {
      setAccountRank('Bronze');
    }
  }, [pixelCount]);

  return (
    <BasicTab title='Account' setActiveTab={props.setActiveTab}>
      <h2 className='Text__medium Heading__sub Account__subheader'>Info</h2>
      <div className='Account__login'>
        <div className='Text__small Button__primary'>StarkNet Login</div>
        <div className='Text__small Button__primary'>Ethereum Login</div>
      </div>
      <p className='Text__small Account__item Account__address'>
        Address: {address}
      </p>
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

      <h2 className='Text__medium Heading__sub Account__subheader'>Stats</h2>
      <p className='Text__small Account__item'>Pixels placed: {pixelCount}</p>
      <p className='Text__small Account__item'>Rank: {accountRank}</p>
    </BasicTab>
  );
};

export default Account;
