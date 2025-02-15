import { constants } from "starknet";
import { sepolia, mainnet, Chain } from "@starknet-react/chains";
import {
  StarknetConfig,
  jsonRpcProvider,
  starkscan,
} from "@starknet-react/core";
import ControllerConnector from "@cartridge/connector/controller";
import { SessionPolicies } from "@cartridge/controller";

export const CANVAS_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CANVAS_CONTRACT_ADDRESS ||
  '0x03ce937f91fa0c88a4023f582c729935a5366385091166a763e53281e45ac410'

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
const connector = new ControllerConnector({
  policies,
  chains: [
      { rpcUrl: SEPOLIA_RPC_URL },
      { rpcUrl: MAINNET_RPC_URL },
  ],
  defaultChainId: constants.StarknetChainId.SN_SEPOLIA,
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
  return (
    <StarknetConfig
      autoConnect
      chains={[mainnet, sepolia]}
      provider={provider}
      connectors={[connector]}
      explorer={starkscan}
    >
      {children}
    </StarknetConfig>
  )
}


