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
    modal.subscribeProvider(async (newProvider) => {
      if (newProvider.provider && newProvider.address) {
        const ethersProvider = new BrowserProvider(newProvider.provider);
        setProvider(ethersProvider);
        setAddress(newProvider.address);
        setIsConnected(true);
      } else {
        setProvider(null);
        setAddress("");
        setIsConnected(false);
      }
    });
  }, []);

  const connectWallet = async () => {
    await modal.open();
  };

  // ✅ correct for v5.1.11
  const disconnectWallet = async () => {
    try {
      await modal.open({ view: "Account" });
    } catch (error) {
      // fallback — just clear state
      setAddress("");
      setIsConnected(false);
      setProvider(null);
    }
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
