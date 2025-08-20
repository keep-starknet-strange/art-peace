import * as sn from "@starknet-react/core";
import * as sol from "@solana/wallet-adapter-react";
import { useRemoteSDK } from "./SolanaProvider";

export const useAccount = () => {
  const snAccount = sn.useAccount();
  const solWallet = sol.useWallet();

  const { sdk } = useRemoteSDK();

  if (snAccount.isConnected) {
    return {
      chain: "Starkent",
      account: snAccount.account,
      address: snAccount.address,
    };
  }

  if (solWallet.connected) {
    return {
      chain: "Solana",
      account: {
        execute: async (calldata: Array<any>) => {
          const hash = await sdk.remoteExecute({
            wallet: solWallet as any,
            sender: solWallet.publicKey!,
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
  const { connect, select, wallets } = sol.useWallet();

  return {
    solConnect: async () => {
      console.log(`connecting to Solana wallet: ${wallets[0].adapter.name}`);
      select(wallets[0].adapter.name);
      await connect();
    },
  };
};

export const useDisconnect = () => {
  const { disconnect: snDisconnect } = sn.useDisconnect();
  const { disconnect: solDisconnect } = sol.useWallet();

  return {
    disconnect: async () => {
      console.log("disconnecting...");
      snDisconnect();
      await solDisconnect();
    },
  };
};
