import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import App from './App.js';

// import { constants } from 'starknet';
import { sepolia, mainnet } from '@starknet-react/chains';
import ControllerConnector from '@cartridge/connector';
// import { SessionConnector } from '@cartridge/connector/session';
import { StarknetConfig, starkscan } from '@starknet-react/core';
import { getProvider } from './utils/Consts';
const StarknetProvider = ({ children }) => {
  const canvasFactory =
    '0x03ce937f91fa0c88a4023f582c729935a5366385091166a763e53281e45ac410'; // TODO: process.env.REACT_APP_CANVAS_FACTORY_CONTRACT_ADDRESS;
  const connector = new ControllerConnector({
    policies: [
      {
        target: canvasFactory,
        method: 'create_canvas',
        description: 'Create a new canvas/world'
      },
      {
        target: canvasFactory,
        method: 'place_pixel',
        description: 'Place a pixel on the canvas'
      },
      {
        target: canvasFactory,
        method: 'favorite_canvas',
        description: 'Favorite a canvas'
      },
      {
        target: canvasFactory,
        method: 'unfavorite_canvas',
        description: 'Unfavorite a canvas'
      },
      {
        target: canvasFactory,
        method: 'add_stencil',
        description: 'Add a stencil to the canvas'
      },
      {
        target: canvasFactory,
        method: 'remove_stencil',
        description: 'Remove a stencil from the canvas'
      },
      {
        target: canvasFactory,
        method: 'favorite_stencil',
        description: 'Favorite a stencil'
      },
      {
        target: canvasFactory,
        method: 'unfavorite_stencil',
        description: 'Unfavorite a stencil'
      }
      // Add more policies as needed
    ]
  });
  /*
  const policies = {
    contracts: {
      [canvasFactory]: {
        methods: [
          {
            name: 'create_canvas',
            entrypoints: 'create_canvas',
            description: 'Create a new canvas/world'
          }
        ]
      }
    }
  };
  */
  /*
    chains: [
      {
        rpcUrl: 'https://api.cartridge.gg/x/starknet/sepolia'
      },
      {
        rpcUrl: 'https://api.cartridge.gg/x/starknet/mainnet'
      }
    ],
    defaultChainId: constants.StarknetChainId.SN_SEPOLIA
    */
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
      provider={getProvider}
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
