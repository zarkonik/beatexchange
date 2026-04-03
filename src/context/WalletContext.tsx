import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { BrowserProvider } from "ethers";
import { modal } from "../config/web3modal";

interface WalletContextType {
  address: string;
  isConnected: boolean;
  provider: BrowserProvider | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType>({
  address: "",
  isConnected: false,
  provider: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  useEffect(() => {
    // ✅ subscribe to account changes
    const unsubscribe = modal.subscribeAccount((account) => {
      if (account?.address && account?.isConnected) {
        setAddress(account.address);
        setIsConnected(true);

        // ✅ get wallet provider
        const walletProvider = modal.getWalletProvider();
        if (walletProvider) {
          const ethersProvider = new BrowserProvider(walletProvider as any);
          setProvider(ethersProvider);
        }
      } else {
        setAddress("");
        setIsConnected(false);
        setProvider(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const connectWallet = async () => {
    await modal.open();
  };

  const disconnectWallet = async () => {
    await modal.open({ view: "Account" });
  };

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        provider,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
