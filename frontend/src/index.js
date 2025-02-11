import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import App from './App.js';

import { constants } from 'starknet';
import { sepolia, mainnet } from '@starknet-react/chains';
import { ControllerConnector } from '@cartridge/connector';
import {
  StarknetConfig,
  starkscan,
  jsonRpcProvider
} from '@starknet-react/core';
// import { getProvider } from './utils/Consts';

const canvasFactory =
  '0x03ce937f91fa0c88a4023f582c729935a5366385091166a763e53281e45ac410'; // TODO: process.env.REACT_APP_CANVAS_FACTORY_CONTRACT_ADDRESS;
const policies = {
  contracts: {
    [canvasFactory]: {
      methods: [
        {
          name: 'create_canvas',
          entrypoints: 'create_canvas',
          description: 'Create a new canvas/world'
        },
        {
          name: 'place_pixel',
          entrypoints: 'place_pixel',
          description: 'Place a pixel on the canvas'
        },
        {
          name: 'favorite_canvas',
          entrypoints: 'favorite_canvas',
          description: 'Favorite a canvas'
        },
        {
          name: 'unfavorite_canvas',
          entrypoints: 'unfavorite_canvas',
          description: 'Unfavorite a canvas'
        },
        {
          name: 'add_stencil',
          entrypoints: 'add_stencil',
          description: 'Add a stencil to the canvas'
        },
        {
          name: 'remove_stencil',
          entrypoints: 'remove_stencil',
          description: 'Remove a stencil from the canvas'
        },
        {
          name: 'favorite_stencil',
          entrypoints: 'favorite_stencil',
          description: 'Favorite a stencil'
        },
        {
          name: 'unfavorite_stencil',
          entrypoints: 'unfavorite_stencil',
          description: 'Unfavorite a stencil'
        }
      ]
    }
  }
};

const connector = new ControllerConnector({
  policies,
  chains: [
    { rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia' },
    { rpcUrl: 'https://api.cartridge.gg/x/starknet/mainnet' }
  ],
  defaultChainId: constants.StarknetChainId.SN_SEPOLIA
});

const provider = jsonRpcProvider({
  rpc: (chain) => {
    switch (chain) {
      case mainnet:
        return { nodeUrl: 'https://api.cartridge.gg/x/starknet/mainnet' };
      case sepolia:
      default:
        return { nodeUrl: 'https://api.cartridge.gg/x/starknet/sepolia' };
    }
  }
});

const StarknetProvider = ({ children }) => {
  // Uncomment to use a custom theme
  // theme: "dope-wars",
  // colorMode: "light"

  /*
  const session = new SessionConnector({
    policies,
    rpc: 'https://api.cartridge.gg/x/starknet/sepolia'
  });
  */

  return (
    <StarknetConfig
      autoConnect
      chains={[sepolia, mainnet]}
      connectors={[connector]}
      explorer={starkscan}
      provider={provider}
    >
      {children}
    </StarknetConfig>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <StarknetProvider>
      <App />
    </StarknetProvider>
  </React.StrictMode>
);
