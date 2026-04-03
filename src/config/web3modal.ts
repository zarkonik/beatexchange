import { createWeb3Modal, defaultConfig } from "@web3modal/ethers";

const projectId = import.meta.env.VITE_WALLETCONNECT_ID;

const sepolia = {
  chainId: 11155111,
  name: "Sepolia",
  currency: "ETH",
  explorerUrl: "https://sepolia.etherscan.io",
  rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
};

const metadata = {
  name: "BeatExchange",
  description: "Web3 Music Marketplace",
  url: window.location.origin, // ✅ automatically uses current URL
  icons: [`${window.location.origin}/favicon.ico`],
};

export const modal = createWeb3Modal({
  ethersConfig: defaultConfig({
    metadata,
    enableEIP6963: true,
    enableInjected: true,
    enableCoinbase: false, // ← disabled since not available
  }),
  chains: [sepolia],
  projectId,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#f0b429",
    "--w3m-border-radius-master": "4px",
  },
  featuredWalletIds: [
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
  ],
});
