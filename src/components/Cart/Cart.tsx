import { useState } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { useCart } from "../../context/CartContext";
import { useNavigation } from "../../context/NavigationContext";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/contract";
import "./Cart.css";

// tracks purchase progress per item
interface ProgressItem {
  id: number;
  title: string;
  status: "pending" | "buying" | "done" | "error";
}

export default function Cart() {
  const { isConnected } = useWallet();
  const { items, removeFromCart, clearCart, totalPrice } = useCart();
  const { navigateTo } = useNavigation();

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState<ProgressItem[]>([]);

  const getPrice = (item: (typeof items)[0]) =>
    item.licenseType === 0 ? item.personalPrice : item.commercialPrice;

  const handleCheckout = async () => {
    if (!isConnected) {
      setStatus("error");
      setMessage("Please connect your wallet first");
      return;
    }

    if (items.length === 0) {
      setStatus("error");
      setMessage("Your cart is empty");
      return;
    }

    try {
      setStatus("loading");

      // initialize progress tracker
      const initialProgress: ProgressItem[] = items.map((item) => ({
        id: item.id,
        title: item.title,
        status: "pending",
      }));
      setProgress(initialProgress);

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // buy each stem one by one
      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // mark current item as buying
        setProgress((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "buying" } : p)),
        );

        setMessage(`Buying "${item.title}" — confirm in MetaMask...`);

        const price = getPrice(item);
        const tx = await contract.buyStem(item.id, item.licenseType, {
          value: price,
        });

        setMessage(`Waiting for "${item.title}" confirmation...`);
        await tx.wait();

        // mark as done
        setProgress((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "done" } : p)),
        );
      }

      setStatus("success");
      setMessage(
        `✅ All ${items.length} stem${items.length > 1 ? "s" : ""} purchased successfully!`,
      );
      clearCart();
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.reason || error?.message || "Purchase failed");

      // mark remaining items as error
      setProgress((prev) =>
        prev.map((p) =>
          p.status === "buying" || p.status === "pending"
            ? { ...p, status: "error" }
            : p,
        ),
      );
    }
  };

  // ── Empty cart ─────────────────────────────
  if (items.length === 0 && status !== "success") {
    return (
      <div className="cart-page">
        <h1>Cart</h1>
        <div className="cart-empty">
          <p>🛒 Your cart is empty</p>
          <button
            className="btn-browse"
            onClick={() => navigateTo("marketplace")}
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Cart</h1>
      <p className="subtitle">Review your stems and complete your purchase</p>

      {/* ── Cart Items ──────────────────────── */}
      {status !== "success" && (
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <span className="cart-item-title">{item.title}</span>
                <span className="cart-item-producer">
                  By{" "}
                  <span>
                    {item.producer.slice(0, 6)}...{item.producer.slice(-4)}
                  </span>
                </span>
                <span
                  className={`cart-license-badge ${item.licenseType === 0 ? "personal" : "commercial"}`}
                >
                  {item.licenseType === 0
                    ? "Personal License"
                    : "Commercial License"}
                </span>
              </div>

              <span className="cart-item-price">
                {formatEther(getPrice(item))} ETH
              </span>

              <button
                className="btn-remove"
                onClick={() => removeFromCart(item.id)}
                disabled={status === "loading"}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Checkout Progress ───────────────── */}
      {progress.length > 0 && (
        <div className="checkout-progress">
          {progress.map((p) => (
            <div
              key={p.id}
              className={`progress-item ${p.status === "done" ? "done" : p.status === "buying" ? "active" : ""}`}
            >
              {p.status === "done" && "✅"}
              {p.status === "buying" && "⏳"}
              {p.status === "pending" && "⬜"}
              {p.status === "error" && "❌"}
              <span>{p.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Status Message ──────────────────── */}
      {status !== "idle" && <div className={`status ${status}`}>{message}</div>}

      {/* ── Order Summary ───────────────────── */}
      {status !== "success" && (
        <div className="cart-summary">
          <h2>Order Summary</h2>

          {items.map((item) => (
            <div key={item.id} className="summary-row">
              <span className="summary-label">{item.title}</span>
              <span className="summary-value">
                {formatEther(getPrice(item))} ETH
              </span>
            </div>
          ))}

          <hr className="summary-divider" />

          <div className="summary-total">
            <span className="summary-total-label">Total</span>
            <span className="summary-total-value">
              {formatEther(totalPrice)} ETH
            </span>
          </div>

          <button
            className="btn-checkout"
            onClick={handleCheckout}
            disabled={status === "loading"}
          >
            {status === "loading"
              ? "⏳ Processing..."
              : `Buy All — ${formatEther(totalPrice)} ETH`}
          </button>

          <button
            className="btn-clear"
            onClick={clearCart}
            disabled={status === "loading"}
          >
            Clear Cart
          </button>
        </div>
      )}

      {/* ── Success State ───────────────────── */}
      {status === "success" && (
        <div className="cart-empty">
          <p>🎉 Purchase complete! Go to Marketplace to download your stems.</p>
          <button
            className="btn-browse"
            onClick={() => navigateTo("marketplace")}
          >
            Go to Marketplace
          </button>
        </div>
      )}
    </div>
  );
}
