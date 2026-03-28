import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { BrowserProvider } from "ethers";

// ── 1. Define the shape of our context ────────────────────────
interface WalletContextType {
  address: string;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

// ── 2. Create the context with a default value ─────────────────
const WalletContext = createContext<WalletContextType>({
  address: "",
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

// ── 3. Create the Provider component ──────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed!");
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
      setIsConnected(true);
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const disconnectWallet = () => {
    setAddress("");
    setIsConnected(false);
  };

  return (
    <WalletContext.Provider
      value={{ address, isConnected, connectWallet, disconnectWallet }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// ── 4. Custom hook ─────────────────────────────────────────────
export function useWallet() {
  return useContext(WalletContext);
}
