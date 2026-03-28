import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WalletProvider } from "./context/WalletContext";
import { NavigationProvider } from "./context/NavigationContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <WalletProvider>
      <NavigationProvider>
        <App />
      </NavigationProvider>
    </WalletProvider>
  </StrictMode>,
);
