import { constants } from "starknet";
import { sepolia, mainnet, Chain } from "@starknet-react/chains";
import {
  StarknetConfig,
  jsonRpcProvider,
  starkscan,
  useInjectedConnectors,
  argent,
  braavos,
} from "@starknet-react/core";
import { ArgentMobileConnector } from "starknetkit/argentMobile"
import { WebWalletConnector } from "starknetkit/webwallet"

import ControllerConnector from "@cartridge/connector/controller";
import { SessionPolicies } from "@cartridge/controller";

export const CANVAS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CANVAS_CONTRACT_ADDRESS || 
"0x011195b78f3765b1b8cfe841363e60f2335adf67af2443364d4b15cf8dff60ac"

// Define session policies
const policies: SessionPolicies = {
  contracts: {
    [CANVAS_CONTRACT_ADDRESS]: {
      methods: [
        {
          name: 'create_canvas',
          entrypoint: 'create_canvas',
          description: 'Create a new canvas/world'
        },
        {
          name: 'place_pixel',
          entrypoint: 'place_pixel',
          description: 'Place a pixel on the canvas'
        },
        {
          name: 'place_pixels',
          entrypoint: 'place_pixels',
          description: 'Place multiple pixels on the canvas'
        },
        {
          name: 'favorite_canvas',
          entrypoint: 'favorite_canvas',
          description: 'Favorite a canvas'
        },
        {
          name: 'unfavorite_canvas',
          entrypoint: 'unfavorite_canvas',
          description: 'Unfavorite a canvas'
        },
        {
          name: 'add_stencil',
          entrypoint: 'add_stencil',
          description: 'Add a stencil to the canvas'
        },
        {
          name: 'remove_stencil',
          entrypoint: 'remove_stencil',
          description: 'Remove a stencil from the canvas'
        },
        {
          name: 'favorite_stencil',
          entrypoint: 'favorite_stencil',
          description: 'Favorite a stencil'
        },
        {
          name: 'unfavorite_stencil',
          entrypoint: 'unfavorite_stencil',
          description: 'Unfavorite a stencil'
        }
      ],
    },
  },
}

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://api.cartridge.gg/x/starknet/sepolia'
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || 'https://api.cartridge.gg/x/starknet/mainnet'
 
// Initialize the connector
const controllerConnector = new ControllerConnector({
  policies,
  chains: [
      { rpcUrl: SEPOLIA_RPC_URL },
      { rpcUrl: MAINNET_RPC_URL },
  ],
  defaultChainId: constants.StarknetChainId.SN_MAIN,
})

// Configure RPC provider
const provider = jsonRpcProvider({
  rpc: (chain: Chain) => {
    switch (chain) {
      case mainnet:
        return { nodeUrl: MAINNET_RPC_URL }
      case sepolia:
      default:
        return { nodeUrl: SEPOLIA_RPC_URL }
    }
  },
})
 
export function StarknetProvider({ children }: { children: React.ReactNode }) {
  const { connectors } = useInjectedConnectors({
    // Show these connectors if the user has no connector installed.
    recommended: [
      argent(),
      braavos(),
    ],
    // Hide recommended connectors if the user has any connector installed.
    includeRecommended: "onlyIfNoConnectors",
    // Randomize the order of the connectors.
    order: "random"
  });
  const mobileConnector = ArgentMobileConnector.init({
    options: {
        dappName: "art/peace",
        url: typeof location !== "undefined" ? location.hostname : "localhost",
        chainId: "SN_MAIN" as any,
        icons: [],
      },
    });
  return (
    <StarknetConfig
      autoConnect
      chains={[mainnet]}
      provider={provider}
      connectors={[controllerConnector, ...connectors, mobileConnector, new WebWalletConnector()]}
      explorer={starkscan}
    >
      {children}
    </StarknetConfig>
  )
}


