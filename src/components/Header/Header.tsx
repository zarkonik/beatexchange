import { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { useNavigation } from "../../context/NavigationContext";
import { useCart } from "../../context/CartContext";
import "./Header.css";

export default function Header() {
  const { address, isConnected, connectWallet, disconnectWallet } = useWallet();
  const { currentPage, navigateTo } = useNavigation();
  const { itemCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const navClick = (e: React.MouseEvent<HTMLAnchorElement>, page: string) => {
    e.preventDefault();
    navigateTo(page);
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-logo">
        Beat<span>Exchange</span>
      </div>

      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav>
        <ul className={`header-nav ${menuOpen ? "open" : ""}`}>
          <li>
            <a
              href="#"
              className={currentPage === "marketplace" ? "active" : ""}
              onClick={(e) => navClick(e, "marketplace")}
            >
              Marketplace
            </a>
          </li>
          <li>
            <a
              href="#"
              className={currentPage === "upload" ? "active" : ""}
              onClick={(e) => navClick(e, "upload")}
            >
              Upload
            </a>
          </li>
          <li>
            <a
              href="#"
              className={currentPage === "mystems" ? "active" : ""}
              onClick={(e) => navClick(e, "mystems")}
            >
              My Stems
            </a>
          </li>
        </ul>
      </nav>

      <div className={`header-wallet ${menuOpen ? "open" : ""}`}>
        {/* ✅ NEW: Cart Icon */}
        <button className="btn-cart" onClick={() => navigateTo("cart")}>
          🛒
          {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
        </button>

        {isConnected ? (
          <>
            <span className="wallet-address">{shortAddress}</span>
            <button className="btn-disconnect" onClick={disconnectWallet}>
              Disconnect
            </button>
          </>
        ) : (
          <button className="btn-connect" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
