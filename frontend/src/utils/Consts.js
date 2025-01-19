import { ec, RpcProvider, constants } from 'starknet';
import backendConfig from '../configs/backend.config.json';

export const backendUrl = backendConfig.production
  ? 'https://' + backendConfig.host
  : 'http://' + backendConfig.host + ':' + backendConfig.port;

export const wsUrl = backendConfig.production
  ? 'wss://' + backendConfig.host + '/ws'
  : 'ws://' + backendConfig.host + ':' + backendConfig.ws_port + '/ws';

export const nftUrl = backendConfig.production
  ? 'https://' + backendConfig.host
  : 'http://' + backendConfig.host + ':' + backendConfig.consumer_port;

export const worldImgUrl = backendConfig.production
  ? 'https://' + backendConfig.host + '/worlds/images/'
  : 'http://' +
    backendConfig.host +
    ':' +
    backendConfig.consumer_port +
    '/worlds/images/';

export const worldUrl = backendConfig.production
  ? 'https://' + backendConfig.host
  : 'http://' + backendConfig.host + ':' + backendConfig.port;

export const templateUrl = backendConfig.production
  ? 'https://' + backendConfig.host
  : 'http://' + backendConfig.host + ':' + backendConfig.port;

export const devnetMode = backendConfig.production === false;

export const convertUrl = (url) => {
  if (!url) {
    return url;
  }
  return url.replace('$BACKEND_URL', backendUrl);
};

export const CHAIN_ID =
  process.env.REACT_APP_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.NetworkName.SN_MAIN
    : constants.NetworkName.SN_SEPOLIA;

export const NODE_URL =
  process.env.REACT_APP_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? 'https://starknet-mainnet.public.blastapi.io'
    : 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';

export const STARKNET_CHAIN_ID =
  process.env.REACT_APP_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.StarknetChainId.SN_MAIN
    : constants.StarknetChainId.SN_SEPOLIA;

//export const provider = new RpcProvider([NODE_URL], STARKNET_CHAIN_ID);
export const provider = new RpcProvider({
  nodeUrl: NODE_URL,
  chainId: STARKNET_CHAIN_ID
});

export function getProvider() {
  return new RpcProvider({
    nodeUrl: NODE_URL
  });
}

export const allowedMethods = [
  {
    'Contract Address': process.env.REACT_APP_USERNAME_STORE_CONTRACT_ADDRESS,
    selector: 'claim_username'
  },
  {
    'Contract Address': process.env.REACT_APP_USERNAME_STORE_CONTRACT_ADDRESS,
    selector: 'change_username'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'claim_today_quest'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'claim_main_quest'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'vote_color'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'place_extra_pixels'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'add_faction_template'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'join_faction'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'join_chain_faction'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'add_chain_faction_template'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'mint_nft'
  },
  {
    'Contract Address': process.env.REACT_APP_CANVAS_NFT_CONTRACT_ADDRESS,
    selector: 'like_nft'
  },
  {
    'Contract Address': process.env.REACT_APP_CANVAS_NFT_CONTRACT_ADDRESS,
    selector: 'unlike_nft'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'increase_day_index'
  },
  {
    'Contract Address': process.env.REACT_APP_STARKNET_CONTRACT_ADDRESS,
    selector: 'place_pixel'
  }
];

export const expiry = Math.floor((Date.now() + 1000 * 60 * 60 * 24) / 1000);

export const ETHTokenAddress =
  '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

export const parseUnits = (value, decimals) => {
  let [integer, fraction = ''] = value.split('.');

  const negative = integer.startsWith('-');
  if (negative) {
    integer = integer.slice(1);
  }

  // If the fraction is longer than allowed, round it off
  if (fraction.length > decimals) {
    const unitIndex = decimals;
    const unit = Number(fraction[unitIndex]);

    if (unit >= 5) {
      /* global BigInt */
      const fractionBigInt = BigInt(fraction.slice(0, decimals)) + BigInt(1);
      fraction = fractionBigInt.toString().padStart(decimals, '0');
    } else {
      fraction = fraction.slice(0, decimals);
    }
  } else {
    fraction = fraction.padEnd(decimals, '0');
  }

  const parsedValue = BigInt(`${negative ? '-' : ''}${integer}${fraction}`);

  return {
    value: parsedValue,
    decimals
  };
};

const ETHFees =
  process.env.REACT_APP_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? [
        {
          tokenAddress: ETHTokenAddress,
          maxAmount: parseUnits('0.001', 18).value.toString()
        }
      ]
    : [
        {
          tokenAddress: ETHTokenAddress,
          maxAmount: parseUnits('0.1', 18).value.toString()
        }
      ];

// TODO: Allow STRK fee tokens
export const metaData = (isStarkFeeToken) => ({
  projectID: 'art-peace',
  txFees: isStarkFeeToken ? [] : ETHFees
});

export const privateKey = ec.starkCurve.utils.randomPrivateKey();
export const dappKey = {
  privateKey: privateKey,
  publicKey: ec.starkCurve.getStarkKey(privateKey)
};
