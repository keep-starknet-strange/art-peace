import * as sn from "@starknet-react/core";
import * as sol from "@solana/wallet-adapter-react";
import { PhantomWalletName } from "@solana/wallet-adapter-wallets";
import { useRemoteSDK } from "../solana-remote-wallet/SolanaProvider";

export const useAccount = () => {
  const snAccount = sn.useAccount();
  const solWallet = sol.useWallet();

  const { sdk } = useRemoteSDK();

  if (snAccount.isConnected) {
    return {
      chain: "starknet",
      account: snAccount.account,
      address: snAccount.address,
    };
  }

  if (solWallet.connected) {
    return {
      chain: "solana",
      account: {
        execute: async (calldata: Array<any>) => {
          const hash = await sdk.remoteExecute({
            wallet: solWallet as any,
            calldata,
            fee: { igp: 135_000_000 },
          });

          return { transaction_hash: hash };
        },
      },
      address: solWallet.publicKey?.toString(),
    };
  }

  return {};
};

export const useSnConnect = () => {
  const { connect, connector, connectors } = sn.useConnect();

  return {
    connect,
    connector,
    connectors,
  };
};

export const useSolConnect = () => {
  const { select } = sol.useWallet();

  return {
    solConnect: async () => {
      select(PhantomWalletName);
    },
  };
};

export const useDisconnect = () => {
  const { disconnect: snDisconnect } = sn.useDisconnect();
  const { disconnect: solDisconnect } = sol.useWallet();

  return {
    disconnect: async () => {
      snDisconnect();
      await solDisconnect();
    },
  };
};
