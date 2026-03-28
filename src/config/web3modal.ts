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
  description: "Buy and sell music stems on the blockchain",
  url: "https://beatexchange.vercel.app",
  icons: ["https://beatexchange.vercel.app/favicon.ico"],
};

export const modal = createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains: [sepolia],
  projectId,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#f0b429",
    "--w3m-border-radius-master": "4px",
  },
});
