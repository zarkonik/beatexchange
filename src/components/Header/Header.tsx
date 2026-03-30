import { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { useNavigation } from "../../context/NavigationContext";
import { useCart } from "../../context/CartContext";
import { useUser } from "../../context/UserContext";
import { isAdminWallet } from "../../config/admin";
import "./Header.css";

export default function Header() {
  const { address, isConnected, connectWallet, disconnectWallet } = useWallet();
  const { currentPage, navigateTo } = useNavigation();
  const { itemCount } = useCart();
  const { profile, avatar } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = isConnected && isAdminWallet(address);

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
              Upload Stem
            </a>
          </li>
          <li>
            <a
              href="#"
              className={currentPage === "upload-pack" ? "active" : ""}
              onClick={(e) => navClick(e, "upload-pack")}
            >
              Upload Pack
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
          {isAdmin && (
            <li>
              <a
                href="#"
                className={currentPage === "admin" ? "active" : ""}
                onClick={(e) => navClick(e, "admin")}
                style={{ color: "var(--error)" }}
              >
                ⚙ Admin
              </a>
            </li>
          )}
        </ul>
      </nav>

      <div className={`header-wallet ${menuOpen ? "open" : ""}`}>
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
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              {avatar ? (
                <img
                  src={avatar}
                  alt="avatar"
                  style={{
                    width: "1.8rem",
                    height: "1.8rem",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "1px solid var(--accent)",
                  }}
                />
              ) : (
                <span style={{ fontSize: "1.2rem" }}>🎛️</span>
              )}
              <span
                className="wallet-address"
                style={{ cursor: "pointer" }}
                onClick={() => navigateTo("profile")}
                title="View profile"
              >
                {profile?.username || shortAddress}
              </span>
            </div>
            <button className="btn-disconnect" onClick={disconnectWallet}>
              Account
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
