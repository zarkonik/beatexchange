import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WalletProvider } from "./context/WalletContext";
import { NavigationProvider } from "./context/NavigationContext";
import { CartProvider } from "./context/CartContext";
import { UserProvider } from "./context/UserContext";
import App from "./App";

import "./config/web3modal"; // ✅ initialize Web3Modal
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <NavigationProvider>
        <CartProvider>
          <UserProvider>
            <App />
          </UserProvider>
        </CartProvider>
      </NavigationProvider>
    </WalletProvider>
  </StrictMode>,
);
