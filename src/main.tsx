import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WalletProvider } from "./context/WalletContext";
import { NavigationProvider } from "./context/NavigationContext";
import { CartProvider } from "./context/CartContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <NavigationProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </NavigationProvider>
    </WalletProvider>
  </StrictMode>,
);
