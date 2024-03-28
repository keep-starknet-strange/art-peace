import React, { useEffect, useState } from 'react';
// import { connect, disconnect } from 'starknetkit'; // TODO: to starknet-react/core instead?
import { connect } from "get-starknet";
import { Contract } from "starknet";
import logo from './logo.svg';
import './App.css';
import Canvas from './Canvas.js';
// TODO: Generate contract.abi.json
import contractAbi from "./contract.abi.json";

function App() {
  //TODO: dynamic modal w/ next/dynamic
      /*
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
        <div>{account ? <DisconnectModal /> : <ConnectModal />}</div>
    };

    connectToStarknet();
  }, []);
      */
  const [provider, setProvider] = useState(null)
  const [address, setAddress] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState(null)
  //const [contract, setContract] = useState(null)
  // TODO: Dynamic contract address
  const contractAddress = process.env.REACT_APP_ART_PEACE_CONTRACT_ADDRESS;

  useEffect(() => {
    const connectToStarknet = async () => {
      try {
        const starknet = await connect()
        //TODO: await starknet?.enable({ starknetVersion: "v4" })
        setProvider(starknet.account)
        setAddress(starknet.selectedAddress)
        setIsConnected(true)
        setChainId(starknet.chainId)
        const contract = new Contract(contractAbi, contractAddress, starknet.account)
        contract.get_width().then(
          (result) => console.log("Contract called", result)
        ).catch(
          (error) => console.log("Contract call failed", error)
        )
        //const pixel_pos = Math.floor(Math.random() * 1000) % 32
        //const pixel_color = Math.floor(Math.random() * 1000) % 10
        //console.log("Setting pixel", pixel_pos, pixel_color)
        //console.log(contract.populate("place_pixel", [pixel_pos, pixel_color]))
        //contract.place_pixel(pixel_pos, pixel_color).then(
        //  (result) => console.log("Contract called", result)
        //).catch(
        //  (error) => console.log("Contract call failed", error)
        //)
        //setContract(contract)
        //setContract(Contract(contractAbi, contractAddress, provider))
      } catch (error) {
        alert(error.message)
      }
    }

    connectToStarknet()
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>art/peace</p>
        <button className="App-button">Wallet</button>
        <div>
          {isConnected ? (
            <div>
              <p>Connected to Starknet</p>
              <p>ChainId: {chainId}</p>
              <p>Address: {address}</p>
            </div>
          ) : (
            <p>Connecting to Starknet...</p>
          )}
        </div>
      </header>
      <div className="App-body">
        <Canvas />
      </div>
    </div>
  );
}

export default App;
