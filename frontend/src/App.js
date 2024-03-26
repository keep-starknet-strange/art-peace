import React, { useEffect, useState } from 'react';
import { connect, disconnect } from 'starknetkit'; // TODO: to starknet-react/core instead?
import logo from './logo.svg';
import './App.css';
import Canvas from './Canvas.js';

function App() {
  const [account, setAccount] = useState('');
  const [chain, setChain] = useState('');

  useEffect(() => {
    const connectToStarknet = async () => {
      const connection = await connect();// { modalMode: "neverAsk" } );

      if (connection && connection.wallet.isConnected) {
        console.log('Connected to Starknet');
        setAccount(connection.wallet.selectedAddress);
        setChain(connection.wallet.chainId);
        // TODO: set connection, provider, address, disconnect, ...
        // TODO: more docs read
        //setConnection(connection);
        //setProvider(connection.account);
        //setAddress(connection.selectedAddress);
      } else {
        console.log('Failed to connect to Starknet');
      }
    };

    connectToStarknet();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>art/peace</p>
        <button className="App-button">Wallet</button>
        <p>Acc: {account} -- {chain}</p>
      </header>
      <div className="App-body">
        <Canvas />
      </div>
    </div>
  );
}

export default App;
