import { createAppKit } from "@reown/appkit";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { sepolia } from "@reown/appkit/networks";

const projectId = import.meta.env.VITE_WALLETCONNECT_ID;

const metadata = {
  name: "BeatExchange",
  description: "Web3 Music Marketplace",
  url: window.location.origin,
  icons: [`${window.location.origin}/favicon.ico`],
};

export const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [sepolia], // ✅ use built-in sepolia from Reown
  projectId,
  metadata,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#f0b429",
    "--w3m-border-radius-master": "4px",
  },
  featuredWalletIds: [
    "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0",
    "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96",
  ],
});

export { sepolia };
