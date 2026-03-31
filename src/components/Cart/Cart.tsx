import { useState } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { useCart } from "../../context/CartContext";
import { useNavigation } from "../../context/NavigationContext";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/contract";
import { purchasePack } from "../../services/packPayment";
import { recordPackPurchase } from "../../services/firebaseServices";
import "./Cart.css";

interface ProgressItem {
  id: string;
  title: string;
  status: "pending" | "buying" | "done" | "error";
}

export default function Cart() {
  const { isConnected, provider } = useWallet();
  const { items, removeFromCart, clearCart, totalPrice } = useCart();
  const { navigateTo } = useNavigation();

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState<ProgressItem[]>([]);

  const getPrice = (item: (typeof items)[0]) => {
    if (item.type === "stem") {
      return item.licenseType === 0
        ? item.personalPrice!
        : item.commercialPrice!;
    } else {
      return BigInt(Math.round(Number(item.price) * 1e18));
    }
  };

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

      const initialProgress: ProgressItem[] = items.map((item) => ({
        id: item.id,
        title: item.title,
        status: "pending",
      }));
      setProgress(initialProgress);

      const p = provider || new BrowserProvider(window.ethereum);
      const signer = await p.getSigner();
      const address = await signer.getAddress();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        setProgress((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "buying" } : p)),
        );

        setMessage(`Buying "${item.title}" — confirm in MetaMask...`);

        if (item.type === "stem") {
          // ── Buy stem via smart contract ──────
          const price = getPrice(item);
          const tx = await contract.buyStem(Number(item.id), item.licenseType, {
            value: price,
          });
          setMessage(`Waiting for "${item.title}" confirmation...`);
          await tx.wait();
        } else {
          // ── Buy pack via direct ETH transfer ──
          const txHash = await purchasePack(item.producer, item.price!, p);

          // record purchase in Firebase
          await recordPackPurchase({
            packId: item.id,
            buyer: address.toLowerCase(),
            producer: item.producer,
            txHash,
            priceEth: item.price!,
          });
        }

        setProgress((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "done" } : p)),
        );
      }

      setStatus("success");
      setMessage(
        `✅ All ${items.length} item${items.length > 1 ? "s" : ""} purchased successfully!`,
      );
      clearCart();
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.reason || error?.message || "Purchase failed");
      setProgress((prev) =>
        prev.map((p) =>
          p.status === "buying" || p.status === "pending"
            ? { ...p, status: "error" }
            : p,
        ),
      );
    }
  };

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
      <p className="subtitle">Review your items and complete your purchase</p>

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
                {item.type === "stem" && (
                  <span
                    className={`cart-license-badge ${item.licenseType === 0 ? "personal" : "commercial"}`}
                  >
                    {item.licenseType === 0
                      ? "Personal License"
                      : "Commercial License"}
                  </span>
                )}
                {item.type === "pack" && (
                  <span className="cart-license-badge commercial">
                    Full Pack
                  </span>
                )}
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

      {status !== "idle" && status !== "loading" && (
        <div className={`status ${status}`}>{message}</div>
      )}

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

      {status === "success" && (
        <div className="cart-empty">
          <p>🎉 Purchase complete!</p>
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
