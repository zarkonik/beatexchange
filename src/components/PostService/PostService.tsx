import { useState } from "react";
import { useWallet } from "../../context/WalletContext";
import { useNavigation } from "../../context/NavigationContext";
import { postService } from "../../services/firebaseServices";
import type {
  ServiceCategory,
  PricingType,
} from "../../services/firebaseServices";
import "./PostService.css";

const CATEGORIES: ServiceCategory[] = [
  "Mixing & Mastering",
  "Beat Making",
  "Sound Design",
  "Vocal Recording",
  "DJ Sets & Remixes",
];

export default function PostService() {
  const { isConnected, address } = useWallet();
  const { navigateTo } = useNavigation();

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<ServiceCategory>("Mixing & Mastering");
  const [description, setDescription] = useState("");
  const [pricingType, setPricingType] = useState<PricingType>("fixed");
  const [fixedPrice, setFixedPrice] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    try {
      // validation
      if (!title) {
        setStatus("error");
        setMessage("Title is required");
        return;
      }
      if (!description) {
        setStatus("error");
        setMessage("Description is required");
        return;
      }
      if (pricingType !== "hourly" && !fixedPrice) {
        setStatus("error");
        setMessage("Fixed price is required");
        return;
      }
      if (pricingType !== "fixed" && !hourlyRate) {
        setStatus("error");
        setMessage("Hourly rate is required");
        return;
      }

      setStatus("loading");
      setMessage("Posting your service...");

      await postService({
        walletAddress: address.toLowerCase(),
        title,
        category,
        description,
        pricingType,
        fixedPrice: fixedPrice ? Number(fixedPrice) : undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        deliveryDays: deliveryDays ? Number(deliveryDays) : undefined,
        portfolioUrl: portfolioUrl || undefined,
      });

      setStatus("success");
      setMessage("✅ Service posted successfully!");

      // reset form
      setTitle("");
      setDescription("");
      setPricingType("fixed");
      setFixedPrice("");
      setHourlyRate("");
      setDeliveryDays("");
      setPortfolioUrl("");
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || "Something went wrong");
    }
  };

  if (!isConnected) {
    return (
      <div className="post-service-page">
        <div className="wallet-warning">
          🔌 Connect your wallet to post a service
        </div>
      </div>
    );
  }

  return (
    <div className="post-service-page">
      <h1>Post a Service</h1>
      <p className="subtitle">
        Offer your skills to the BeatExchange community
      </p>

      <div className="post-service-form">
        {/* Title */}
        <div className="form-group">
          <label>Service Title</label>
          <input
            type="text"
            placeholder="e.g. Professional Mix & Master"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ServiceCategory)}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Describe your service, experience, what's included..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
          />
          <span className="hint">{description.length}/1000 characters</span>
        </div>

        {/* Pricing Type */}
        <div className="form-group">
          <label>Pricing Type</label>
          <div className="pricing-type-selector">
            {(["fixed", "hourly", "both"] as PricingType[]).map((type) => (
              <button
                key={type}
                className={`pricing-type-btn ${pricingType === type ? "active" : ""}`}
                onClick={() => setPricingType(type)}
              >
                {type === "fixed" && "Fixed Price"}
                {type === "hourly" && "Hourly Rate"}
                {type === "both" && "Both"}
              </button>
            ))}
          </div>
        </div>

        {/* Prices */}
        <div className="price-row">
          {(pricingType === "fixed" || pricingType === "both") && (
            <div className="form-group">
              <label>Fixed Price (USD)</label>
              <input
                type="number"
                placeholder="50"
                value={fixedPrice}
                onChange={(e) => setFixedPrice(e.target.value)}
                min="0"
              />
              <span className="hint">One-time project fee</span>
            </div>
          )}
          {(pricingType === "hourly" || pricingType === "both") && (
            <div className="form-group">
              <label>Hourly Rate (USD)</label>
              <input
                type="number"
                placeholder="30"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                min="0"
              />
              <span className="hint">Per hour rate</span>
            </div>
          )}
        </div>

        {/* Delivery */}
        <div className="form-group">
          <label>Delivery Time (days)</label>
          <input
            type="number"
            placeholder="3"
            value={deliveryDays}
            onChange={(e) => setDeliveryDays(e.target.value)}
            min="1"
          />
          <span className="hint">Estimated delivery in days</span>
        </div>

        {/* Portfolio */}
        <div className="form-group">
          <label>Portfolio URL (optional)</label>
          <input
            type="url"
            placeholder="https://soundcloud.com/yourprofile"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
          />
          <span className="hint">Link to your work samples</span>
        </div>

        {/* Status */}
        {status !== "idle" && (
          <div className={`status ${status}`}>{message}</div>
        )}

        {/* Buttons */}
        <button
          className="btn-post-service"
          onClick={handleSubmit}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Posting..." : "+ Post Service"}
        </button>

        {status === "success" && (
          <button
            className="btn-post-service"
            style={{
              background: "transparent",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
            }}
            onClick={() => navigateTo("services")}
          >
            View All Services
          </button>
        )}
      </div>
    </div>
  );
}
