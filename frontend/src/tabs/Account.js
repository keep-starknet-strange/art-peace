import React, { useState } from "react";
import "./Account.css";
import BasicTab from "./BasicTab.js";

const Account = (props) => {
  // TODO: Create the account tab w/ wallet address, username, pixel info, top X % users ( pixels placed? ), ...
  const [username, setUsername] = useState("");
  const [isUsernameSaved, saveUsername] = useState(false);
  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(event);
    setUsername(username);
    saveUsername(true);
  }
  return (
    <BasicTab title="Account">
      <div className="Account__flex">
        <p>Address:</p>
        <p className="Account__wrap">
          0x0000000000000000000000000000000000000000000000000000000000000000
        </p>
      </div>
      <div className="Account__flex Account__flex--center">
        <p>Username:</p>
        {isUsernameSaved ? (
          <p>{username}</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              <input
                className="Account__input"
                type="text"
                value={username}
                required
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <button className="Account__button" type="submit">update</button>
          </form>
        )}
      </div>
      <div className="Account__flex">
        <p>Pixel count:</p>
        <p>572</p>
      </div>
      <div className="Account__flex">
        <p>Top 5 🔥</p>
        <ul className="Account__list">
          <li>0x20579</li>
          <li>0x00918</li>
          <li>0x55603</li>
          <li>0x07802</li>
          <li>0x09166</li>
        </ul>
      </div>
    </BasicTab>
  );
};

export default Account;
