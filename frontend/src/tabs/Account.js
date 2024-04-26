import React, { useState, useEffect } from "react";
import "./Account.css";
import BasicTab from "./BasicTab.js";
import backendConfig from "../configs/backend.config.json";

const Account = (props) => {
  const backendUrl = "http://" + backendConfig.host + ":" + backendConfig.port;
  const [username, setUsername] = useState("");
  const [pixelCount, setPixelCount] = useState(0);
  const [accountRank, setAccountRank] = useState("");
  const [isUsernameSaved, saveUsername] = useState(false);
  
  const userAddress = "0x0000000000000000000000000000000000000000000000000000000000000000";
  
  const handleSubmit = (event) => {
    event.preventDefault();
    setUsername(username);
    saveUsername(true);
  };
  
  const editUsername = (e) => {
    saveUsername(false);
  };

  useEffect(() => {
    const getUsernameUrl = `${backendUrl}/get-username?address=${userAddress}`;
    fetch(getUsernameUrl, {mode: "cors"})
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch username');
          
        }
        return res.json();
      })
      .then(data => {
        if (data.username === null || data.username === "") {
          setUsername("");
          saveUsername(false);
        } else {
          setUsername(data.username);
          saveUsername(true);
        }
      })
      .catch(error => { 
        console.error('Failed to fetch username:', error);
      });
  }, [userAddress]);

  
  useEffect(() => {
    const fetchPixelCount = async () => {
      const getPixelCountUrl = `${backendUrl}/get-pixel-count?address=${userAddress}`;
      const response = await fetch(getPixelCountUrl, {mode: "cors"});
      if (response.ok) {
        const data = await response.json();
        setPixelCount(data.count);
      } else {
        console.error('Failed to fetch pixel count:', await response.text());
      }
    };

    fetchPixelCount();
  }, [userAddress]);

  useEffect(() => {
    // Update rank based on pixel count
    if (pixelCount >= 5000) {
      setAccountRank("Champion");
    } else if (pixelCount >= 3000) {
      setAccountRank("Platinum");
    } else if (pixelCount >= 2000) {
      setAccountRank("Gold");
    } else if (pixelCount >= 1000) {
      setAccountRank("Silver");
    } else {
      setAccountRank("Bronze");
    }
  }, [pixelCount]);

  return (
    <BasicTab title="Account">
      <div className="Account__flex">
        <p>Address:</p>
        <p className="Account__wrap">{userAddress}</p>
      </div>
      <div className="Account__flex Account__flex--center">
        <p>Username:</p>
        {isUsernameSaved ? (
          <div className="Account__user">
            <p>{username}</p>
            <button
              className="Account__button Account__button--edit"
              type="button"
              onClick={editUsername}
            >
              edit
            </button>
          </div>
        ) : (
          <form className="Account__user" onSubmit={handleSubmit}>
            <label>
              <input
                className="Account__input"
                type="text"
                value={username}
                required
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <button
              className="Account__button Account__button--submit"
              type="submit"
            >
              update
            </button>
          </form>
        )}
      </div>
      <div className="Account__flex">
        <p>Pixel count:</p>
        <p>{pixelCount}</p>
      </div>
      <div className="Account__flex">
        <p>Current Rank:</p>
        <p>{accountRank}</p>
      </div>
    </BasicTab>
  );
};

export default Account;
