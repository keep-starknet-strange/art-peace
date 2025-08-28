import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { constants } from "starknet";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

import { RemoteWallet, VALUES } from "@danielgluskinstark/solana-remote-wallet";
import { createContext, useContext, useMemo } from "react";

type SDKContextType = {
  sdk: RemoteWallet;
};

const wallets = [new PhantomWalletAdapter()];

const SolanaSDKContext = createContext<SDKContextType | undefined>(undefined);

export const SolanaSDKProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const isMainnet =
    process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN;

  const sdk = useMemo(() => {
    return RemoteWallet.create(isMainnet ? VALUES.MAINNET : VALUES.SEPOLIA);
  }, []);

  const network = clusterApiUrl(isMainnet ? "mainnet-beta" : "testnet");

  return (
    <SolanaSDKContext.Provider value={{ sdk }}>
      <ConnectionProvider endpoint={network}>
        <WalletProvider wallets={wallets} autoConnect>
          {children}
        </WalletProvider>
      </ConnectionProvider>
    </SolanaSDKContext.Provider>
  );
};

export function useRemoteSDK() {
  const context = useContext(SolanaSDKContext);

  if (!context) {
    throw new Error("useSDK must be used within an SDKProvider");
  }

  return context;
}
