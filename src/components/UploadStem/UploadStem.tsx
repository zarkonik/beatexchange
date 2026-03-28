import { useState } from "react";
import { BrowserProvider, Contract, parseEther } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/contract";
import "./UploadStem.css";

export default function UploadStem() {
  const { isConnected } = useWallet();

  const [title, setTitle] = useState("");
  const [personalPrice, setPersonalPrice] = useState("");
  const [commercialPrice, setCommercialPrice] = useState("");
  const [royaltyRate, setRoyaltyRate] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    try {
      if (!title) {
        setStatus("error");
        setMessage("Title is required");
        return;
      }
      if (!personalPrice) {
        setStatus("error");
        setMessage("Personal price is required");
        return;
      }
      if (!commercialPrice) {
        setStatus("error");
        setMessage("Commercial price is required");
        return;
      }
      if (!royaltyRate) {
        setStatus("error");
        setMessage("Royalty rate is required");
        return;
      }

      setStatus("loading");
      setMessage("Waiting for MetaMask confirmation...");

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.uploadStem(
        title,
        parseEther(personalPrice),
        parseEther(commercialPrice),
        Number(royaltyRate),
      );

      setMessage("Transaction submitted — waiting for confirmation...");
      await tx.wait();

      setStatus("success");
      setMessage(`✅ Stem "${title}" uploaded successfully!`);

      setTitle("");
      setPersonalPrice("");
      setCommercialPrice("");
      setRoyaltyRate("");
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.reason || error?.message || "Something went wrong");
    }
  };

  if (!isConnected) {
    return (
      <div className="upload-page">
        <div className="wallet-warning">
          🔌 Connect your wallet to upload stems
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <h1>Upload Stem</h1>
      <p className="subtitle">
        Mint your stem as an NFT and set your license prices
      </p>

      <div className="upload-form">
        <div className="form-group">
          <label>Stem Title</label>
          <input
            type="text"
            placeholder="e.g. Hard Trap 808"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        <div className="price-row">
          <div className="form-group">
            <label>Personal Price (ETH)</label>
            <input
              type="number"
              placeholder="0.01"
              value={personalPrice}
              onChange={(e) => setPersonalPrice(e.target.value)}
              min="0"
              step="0.001"
            />
            <span className="hint">Non-commercial use only</span>
          </div>

          <div className="form-group">
            <label>Commercial Price (ETH)</label>
            <input
              type="number"
              placeholder="0.05"
              value={commercialPrice}
              onChange={(e) => setCommercialPrice(e.target.value)}
              min="0"
              step="0.001"
            />
            <span className="hint">For monetized releases</span>
          </div>
        </div>

        <div className="form-group">
          <label>Royalty Rate (%)</label>
          <input
            type="number"
            placeholder="5"
            value={royaltyRate}
            onChange={(e) => setRoyaltyRate(e.target.value)}
            min="0"
            max="50"
          />
          <span className="hint">
            % you earn when someone uses this stem in a song (max 50%)
          </span>
        </div>

        {status !== "idle" && (
          <div className={`status ${status}`}>{message}</div>
        )}

        <button
          className="btn-upload"
          onClick={handleUpload}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Uploading..." : "⬆ Upload Stem"}
        </button>
      </div>
    </div>
  );
}
