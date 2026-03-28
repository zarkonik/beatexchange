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
              className={currentPage === "services" ? "active" : ""}
              onClick={(e) => navClick(e, "services")}
            >
              Services
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
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="cart-icon"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
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
