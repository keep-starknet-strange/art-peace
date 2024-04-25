import React, { useState, useEffect } from "react";
import "./Account.css";
import BasicTab from "./BasicTab.js";
import backendConfig from "../configs/backend.config.json";

const Account = (props) => {
  const backendUrl = "http://" + backendConfig.host + ":" + backendConfig.port;
  const getUsernameUrl = `${backendUrl}/getUsername?address=${address}`;
  const address = 0
  // TODO: Create the account tab w/ wallet address, username, pixel info, top X % users ( pixels placed? ), ...
  const [username, setUsername] = useState("");
  const [pixelCount, setPixelCount] = useState(2572);
  const [accountRank, setAccountRank] = useState("");
  const [isUsernameSaved, saveUsername] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setUsername(username);
    saveUsername(true);
  };

  const editUsername = (e) => {
    saveUsername(false);
  };

  useEffect(() => {
    fetch(getUsernameUrl, {mode: "cors"})
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch username');
          
        }
        return res.json();
      })
      .then(data => {
        setUsername(data.username);
        saveUsername(true);
      })
      .catch(error => { 
        saveUsername(false)
      });

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
  }, [pixelCount, getUsernameUrl]);

  return (
    <BasicTab title="Account">
      <div className="Account__flex">
        <p>Address:</p>
        <p className="Account__wrap">
          0x0000000000000000000000000
        </p>
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
