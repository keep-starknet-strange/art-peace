import React, { useState, useEffect } from 'react';
import { useDisconnect, useContractWrite } from '@starknet-react/core';
import './Account.css';
import BasicTab from '../BasicTab.js';
import '../../utils/Styles.css';
import { backendUrl, devnetMode } from '../../utils/Consts.js';
import { fetchWrapper } from '../../services/apiService.js';
import { encodeToLink } from '../../utils/encodeToLink';
import BeggarRankImg from '../../resources/ranks/Beggar.png';
import OwlRankImg from '../../resources/ranks/Owl.png';
import CrownRankImg from '../../resources/ranks/Crown.png';
import WolfRankImg from '../../resources/ranks/Wolf.png';
import EditIcon from '../../resources/icons/Edit.png';
import SearchIcon from '../../resources/icons/Search.png';
import ArgentIcon from '../../resources/icons/Argent.png';
import BraavosIcon from '../../resources/icons/Braavos.png';

const Account = (props) => {
  const [username, setUsername] = useState('');
  const [pixelCount, setPixelCount] = useState(0);
  const [accountRank, setAccountRank] = useState('');
  // TODO: Mint rank images when reached w/ button
  const [rankBackground, setRankBackground] = useState({
    background:
      'linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1))'
  });
  const [accountRankImg, setAccountRankImg] = useState(null);

  const [usernameSaved, setUsernameSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [usernameBeforeEdit, setUsernameBeforeEdit] = useState('');

  const [isValidUsername, setIsValidUsername] = useState(false);
  let [usernameTaken, setUsernameTaken] = useState(false);
  useEffect(() => {
    setUsernameTaken(false);
    if (username === '') {
      setIsValidUsername(false);
      return;
    }
    if (username.length > 30 || username.length < 3) {
      setIsValidUsername(false);
      return;
    }
    // Allow: a-z, A-Z, 0-9, -, _, .
    if (!/^[a-zA-Z0-9-_.]*$/.test(username)) {
      setIsValidUsername(false);
      return;
    }
    setIsValidUsername(true);
  }, [username]);

  const toHex = (str) => {
    let hex = '0x';
    for (let i = 0; i < str.length; i++) {
      hex += '' + str.charCodeAt(i).toString(16);
    }
    return hex;
  };

  const connectorLogo = (name) => {
    switch (name) {
      case 'Argent':
      case 'ArgentX':
      case 'argentX':
      case 'Argent X':
        return ArgentIcon;
      case 'Braavos':
      case 'braavos':
        return BraavosIcon;
      default:
        return null;
    }
  };

  const connectorName = (name) => {
    switch (name) {
      case 'Argent':
      case 'ArgentX':
      case 'argentX':
      case 'Argent X':
        return 'Argent X';
      case 'Braavos':
      case 'braavos':
        return 'Braavos';
      default:
        return name;
    }
  };

  // TODO: Connect wallet page if no connectors
  let [availableConnectors, setAvailableConnectors] = useState([]);
  const { disconnect } = useDisconnect();

  const [addressShort, setAddressShort] = useState('');
  useEffect(() => {
    if (!props.address) return;
    setAddressShort(
      props.address
        ? `${props.address.slice(0, 6)}...${props.address.slice(-4)}`
        : ''
    );
  }, [props.address]);

  const [userAwards, setUserAwards] = useState([]);
  const [claimText, setClaimText] = useState('');
  useEffect(() => {
    const fetchAwards = async () => {
      const getAwardsUrl = `${backendUrl}/get-user-rewards?address=${props.queryAddress}`;
      const response = await fetch(getAwardsUrl);
      if (response.ok) {
        const result = await response.json();
        setUserAwards(result.data);
        let claimTextStr = 'You qualify for the following awards: \n';
        if (!result.data || result.data.length === 0) {
          claimTextStr += 'No awards\n';
          setClaimText(claimTextStr);
          return;
        }
        for (let i = 0; i < result.data.length; i++) {
          let claimObject = result.data[i];
          claimTextStr +=
            claimObject.type + ' : ' + claimObject.amount + 'STRK\n';
        }
        claimTextStr += '\nTo claim your award:\n';
        // TODO: Hardcoded issue link
        claimTextStr +=
          '1. Create a [github account](https://github.com) if you dont have one. \n2. Sign up for [OnlyDust](https://app.onlydust.com) and create a Billing Profile with your Starknet account used in the art/peace competition. \n3. Comment on [this Github issue](https://github.com/keep-starknet-strange/art-peace/issues/251) with a photo of your account page and what awards you qualify for. \nFollow us on [twitter](https://x.com/art_peace_sn) or join [telegram](https://t.me/art_peace_starknet/1) if you have questions! \nThank you!';
        setClaimText(claimTextStr);
      } else {
        console.error('Failed to fetch awards:', await response.text());
      }
    };

    fetchAwards();
  }, [props.queryAddress]);

  const [showClaimInfo, setShowClaimInfo] = useState(false);
  useEffect(() => {
    if (showClaimInfo) {
      props.setModal({
        title: 'How to claim',
        text: claimText,
        confirm: 'Done',
        action: () => {
          setShowClaimInfo(false);
        },
        closeAction: () => {
          setShowClaimInfo(false);
        }
      });
    }
  }, [showClaimInfo, userAwards]);

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
    if (devnetMode) {
      setAvailableConnectors(props.connectors);
      return;
    }

    const checkIfAvailable = async () => {
      let availableConnectors = [];
      for (let i = 0; i < props.connectors.length; i++) {
        let available = await props.connectors[i].available();
        if (available) {
          availableConnectors.push(props.connectors[i]);
        }
      }
      setAvailableConnectors(availableConnectors);
    };
    checkIfAvailable();
  }, [props.connectors]);

  const disconnectWallet = () => {
    if (devnetMode) {
      props.setConnected(false);
      return;
    }
    disconnect();
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
    // Check if username is unique
    if (!isValidUsername) return;
    if (usernameTaken) return;
    let uniqueRequestUrl = `check-username-unique?username=${username}`;
    const uniqueResponse = await fetchWrapper(uniqueRequestUrl);
    if (uniqueResponse.data === null) {
      console.error('Failed to check if username is unique:', uniqueResponse);
      return;
    } else if (uniqueResponse.data !== 0) {
      setUsernameTaken(true);
      return;
    }
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

  // TODO: Non editable while loading get-username
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

  const [animatedRankColor, setAnimatedRankColor] = React.useState(0);
  const btrColorOffset = 1000;
  useEffect(() => {
    if (pixelCount < 50) return;
    const interval = setInterval(() => {
      setAnimatedRankColor((animatedRankColor + 3) % 360);
      setRankBackground({
        background: `linear-gradient(45deg, hsl(${animatedRankColor}, 100%, 50%), hsl(${(animatedRankColor + btrColorOffset) % 360}, 100%, 50%))`
      });
    }, 50);
    return () => clearInterval(interval);
  }, [animatedRankColor, pixelCount]);

  useEffect(() => {
    if (pixelCount >= 50) {
      setAccountRank('Alpha Wolf');
      setAccountRankImg(WolfRankImg);
    } else if (pixelCount >= 30) {
      setAccountRank('Degen Artist');
      setRankBackground({
        background:
          'linear-gradient(45deg, rgba(255, 215, 0, 0.9), rgba(255, 215, 0, 0.6))'
      });
      setAccountRankImg(CrownRankImg);
    } else if (pixelCount >= 10) {
      setAccountRank('Pixel Wizard');
      setRankBackground({
        background:
          'linear-gradient(45deg, rgba(192, 192, 200, 0.9), rgba(192, 192, 200, 0.6))'
      });
      setAccountRankImg(OwlRankImg);
    } else {
      setAccountRank('Art Beggar');
      setRankBackground({
        background:
          'linear-gradient(45deg, rgba(205, 127, 50, 0.9), rgba(205, 127, 50, 0.6))'
      });
      setAccountRankImg(BeggarRankImg);
    }
  }, [pixelCount]);

  const [starknetWalletMode, setStarknetWalletMode] = useState(false);
  const connectStarknetWallet = async () => {
    setStarknetWalletMode(true);
  };

  const showPixelHistory = () => {
    // TODO: Show pixel history
    console.log('Show pixel history');
  };

  // TODO: Ethereum login

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
              className='Text__medium Button__primary Account__login__button'
              onClick={connectStarknetWallet}
            >
              StarkNet Login
            </div>
          </div>
          <div
            className={
              'Account__wallet__select' +
              (starknetWalletMode ? ' Account__wallet__select--expanded' : '')
            }
          >
            <div className='Account__walletmode__separator'></div>
            <div className='Account__walletmode__connect'>
              {availableConnectors.map((connector) => {
                return (
                  <div
                    className='Text__medium Button__primary Account__walletlogin__button'
                    key={connector.id}
                    onClick={() => props.connectWallet(connector)}
                  >
                    {connectorLogo(connector.name) && (
                      <img
                        className='Account__wallet__icon'
                        src={connectorLogo(connector.name)}
                        alt='wallet'
                      />
                    )}
                    <p>{connectorName(connector.name)}</p>
                  </div>
                );
              })}
              {availableConnectors.length === 0 && (
                <div>
                  <p className='Text__small Account__wallet__noconnectors'>
                    Please install a Starknet wallet extension
                  </p>
                  <div
                    className='Text__medium Button__primary Account__walletlogin__button'
                    onClick={() =>
                      window.open(
                        'https://www.argent.xyz/argent-x/',
                        '_blank',
                        'noreferrer'
                      )
                    }
                  >
                    Argent X
                  </div>
                  <div
                    className='Text__medium Button__primary Account__walletlogin__button'
                    onClick={() =>
                      window.open(
                        'https://braavos.app/download-braavos-wallet/',
                        '_blank',
                        'noreferrer'
                      )
                    }
                  >
                    Braavos
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {props.queryAddress !== '0' && (
        <div>
          <h2 className='Text__medium Heading__sub Account__subheader'>Info</h2>
          {usernameSaved && !isEditing ? (
            <div className='Account__item__user'>
              <p className='Text__small Account__item__label'>Username</p>
              <div className='Account__item__username'>
                <p className='Text__small Account__item__un'>{username}</p>
                {!props.gameEnded && (
                  <div
                    className='Text__small Button__primary Account__item__button'
                    onClick={editUsername}
                  >
                    <img
                      className='Account__item__icon'
                      src={EditIcon}
                      alt='edit'
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='Account__form'>
              <p className='Text__small Account__form__label'>Username</p>
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
                <div className='Account__item__pair'>
                  <button
                    className={`Text__small Button__primary ${isValidUsername && !usernameTaken ? '' : 'Button__disabled'}`}
                    type='submit'
                    disabled={!isValidUsername || usernameTaken}
                  >
                    submit
                  </button>
                  {isEditing && (
                    <button
                      className='Text__small Button__primary Account__cancel__button'
                      onClick={handleCancelEdit}
                      type='button'
                    >
                      X
                    </button>
                  )}
                </div>
              </form>
              {!isValidUsername && username.length > 3 && (
                <p className='Text__xsmall Account__form__error'>
                  Invalid username: 3 - 30 characters, a-z, A-Z, 0-9, -, _, .
                </p>
              )}
              {usernameTaken && (
                <p className='Text__xsmall Account__form__error'>
                  Username is already taken
                </p>
              )}
            </div>
          )}

          <div className='Account__item Account__item__separator'>
            <p className='Text__medium Account__item__label'>Rank</p>
            <div className='Text__small Account__rank'>
              <div className='Account__rank__outer' style={rankBackground}>
                <div className='Account__rank__inner'>
                  <img
                    className='Account__rank__img'
                    src={accountRankImg}
                    alt='rank'
                  />
                  <p className='Text__small Account__rank__text'>
                    {accountRank}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className='Account__item'>
            <p className='Text__small Account__item__label'>Address</p>
            <p className='Text__small Account__item__text'>{addressShort}</p>
          </div>
          {devnetMode && (
            <div className='Account__item'>
              <p className='Text__small Account__item__label'>Dev Account</p>
              <p className='Text__small Account__item__text'>
                0x{props.queryAddress.slice(0, 4)}...
                {props.queryAddress.slice(-4)}
              </p>
            </div>
          )}
          <div className='Account__item'>
            <p className='Text__small Account__item__label'>Network</p>
            <p className='Text__small Account__item__text'>
              {props.chain.network.toUpperCase()}
            </p>
          </div>

          <h2 className='Text__medium Heading__sub Account__subheader'>
            Stats
          </h2>
          <div className='Account__item'>
            <p className='Text__small Account__item__label'>Pixels placed</p>
            <div className='Account__item__pair'>
              <p className='Text__small Account__item__label'>{pixelCount}</p>
              {false && (
                <div
                  className='Button__primary Account__item__button'
                  onClick={showPixelHistory}
                >
                  <img
                    className='Account__item__icon'
                    src={SearchIcon}
                    alt='show'
                  />
                </div>
              )}
            </div>
          </div>
          <div className='Account__item'>
            <p className='Text__small Account__item__label'>Awards</p>
            <div className='Account__item__pair'>
              <p className='Text__small Account__item__label'>
                {userAwards ? `${userAwards.length} awards` : 'No awards'}
              </p>
              <div
                className='Button__primary Account__item__button'
                onClick={() => setShowClaimInfo(!showClaimInfo)}
                style={{
                  display:
                    userAwards && userAwards.length > 0 ? 'block' : 'none'
                }}
              >
                Claim
              </div>
            </div>
          </div>
          <div className='Account__disconnect__button__separator'></div>
          <div className='Account__footer'>
            <div className='Account__kudos'>
              <p
                dangerouslySetInnerHTML={encodeToLink(
                  'Special thanks to all [OnlyDust](https://app.onlydust.com/p/artpeace) contributors!'
                )}
                className='Text__small Account__kudos__label'
              ></p>
            </div>
            <div
              className='Text__medium Button__primary Account__disconnect__button'
              onClick={() => disconnectWallet()}
            >
              Logout
            </div>
          </div>
        </div>
      )}
    </BasicTab>
  );
};

export default Account;
