import React, { useState, useEffect } from "react";
import "./Account.css";
import BasicTab from "./BasicTab.js";

const Account = (props) => {
  const [username, setUsername] = useState("");
  const [pixelCount, setPixelCount] = useState(0); // Set initial pixel count to 0
  const [accountRank, setAccountRank] = useState("");
  const [isUsernameSaved, saveUsername] = useState(false);

  const userAddress = "0x0000000000000000000000000000000000000000000000000000000000000000"; // This should ideally come from props or context

  const handleSubmit = (event) => {
    event.preventDefault();
    setUsername(username);
    saveUsername(true);
  };

  const editUsername = (e) => {
    saveUsername(false);
  };

  useEffect(() => {
    const fetchPixelCount = async () => {
      const response = await fetch(`http://localhost:8080/getPixelCount?address=${userAddress}`);
      if (response.ok) {
        const count = await response.text();
        setPixelCount(parseInt(count, 10));
      } else {
        console.error('Failed to fetch pixel count:', await response.text());
      }
    };

    fetchPixelCount();
  }, [userAddress]); // Fetch pixel count when userAddress changes

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
  }, [pixelCount]); // Recalculate rank when pixel count changes

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
            <button className="Account__button Account__button--edit" type="button" onClick={editUsername}>
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
            <button className="Account__button Account__button--submit" type="submit">
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
