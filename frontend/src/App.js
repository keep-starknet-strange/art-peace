import React, { useEffect, useState } from 'react';
//import { connect } from "get-starknet";
//import { Contract } from "starknet";
import './App.css';
import Canvas from './Canvas.js';
import Tabs from './Tabs.js';
import PixelSelector from './PixelSelector.js';
// TODO: Generate contract.abi.json

function usePreventZoom(scrollCheck = true, keyboardCheck = true) {
    useEffect(() => {
      const handleKeydown = (e) => {
        if (
          keyboardCheck &&
          e.ctrlKey &&
          (e.keyCode == "61" ||
            e.keyCode == "107" ||
            e.keyCode == "173" ||
            e.keyCode == "109" ||
            e.keyCode == "187" ||
            e.keyCode == "189")
        ) {
          e.preventDefault();
        }
      };
  
      const handleWheel = (e) => {
        if (scrollCheck && e.ctrlKey) {
          e.preventDefault();
        }
      };
  
      document.addEventListener("keydown", handleKeydown);
      document.addEventListener("wheel", handleWheel, { passive: false });
  
      return () => {
        document.removeEventListener("keydown", handleKeydown);
        document.removeEventListener("wheel", handleWheel);
      };
    }, [scrollCheck, keyboardCheck]);
  }

function App() {

  /*
  // TODO: Wallet integration
  const [provider, setProvider] = useState(null)
  const [address, setAddress] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [chainId, setChainId] = useState(null)
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
        //  (result) => console.log("Contract called", result)).catch(
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
  */

  usePreventZoom();

  // TODO: use -1 for all or other state
  // TODO: move pixel selected rhs panel
  const [selectedColorId, setSelectedColorId] = useState(-1);

  return (
    <div className="App">
      <Canvas selectedColorId={selectedColorId} setSelectedColorId={setSelectedColorId} />
      <div className="App__rhs-panel">
      </div>
      <div className="App__footer">
        <PixelSelector selectedColorId={selectedColorId} setSelectedColorId={setSelectedColorId} />
        <Tabs />
      </div>
    </div>
  );
}

export default App;
