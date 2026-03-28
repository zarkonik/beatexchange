import { useState, useEffect } from "react";
import { BrowserProvider, Contract, parseEther } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/contract";
import { uploadToPinata } from "../../services/pinata";
import { isWalletBanned } from "../../services/firebaseServices";
import "./UploadStem.css";

export default function UploadStem() {
  const { isConnected, address } = useWallet();

  const [title, setTitle] = useState("");
  const [personalPrice, setPersonalPrice] = useState("");
  const [commercialPrice, setCommercialPrice] = useState("");
  const [royaltyRate, setRoyaltyRate] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [isBanned, setIsBanned] = useState(false);

  // ── Check ban status ───────────────────────
  useEffect(() => {
    const checkBan = async () => {
      if (isConnected && address) {
        const banned = await isWalletBanned(address);
        setIsBanned(banned);
      }
    };
    checkBan();
  }, [isConnected, address]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      setStatus("error");
      setMessage("Please select an audio file — MP3, WAV or FLAC only");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setStatus("error");
      setMessage("File is too large — maximum size is 100MB");
      return;
    }

    setAudioFile(file);
    setStatus("idle");
    setMessage("");
  };

  const handleUpload = async () => {
    try {
      // check ban
      const banned = await isWalletBanned(address);
      if (banned) {
        setStatus("error");
        setMessage("⛔ Your wallet has been banned from uploading stems.");
        return;
      }

      // validation
      if (!title) {
        setStatus("error");
        setMessage("Title is required");
        return;
      }
      if (!audioFile) {
        setStatus("error");
        setMessage("Audio file is required");
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

      // step 1 — upload to IPFS
      setStatus("loading");
      setMessage("Uploading audio to IPFS...");
      const ipfsHash = await uploadToPinata(audioFile);

      // step 2 — save on blockchain
      setMessage("Waiting for MetaMask confirmation...");
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.uploadStem(
        title,
        ipfsHash,
        parseEther(personalPrice),
        parseEther(commercialPrice),
        Number(royaltyRate),
      );

      setMessage("Transaction submitted — waiting for confirmation...");
      await tx.wait();

      setStatus("success");
      setMessage(`✅ Stem "${title}" uploaded successfully!`);

      // reset form
      setTitle("");
      setPersonalPrice("");
      setCommercialPrice("");
      setRoyaltyRate("");
      setAudioFile(null);
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.reason || error?.message || "Something went wrong");
    }
  };

  // ── Not connected ──────────────────────────
  if (!isConnected) {
    return (
      <div className="upload-page">
        <div className="wallet-warning">
          🔌 Connect your wallet to upload stems
        </div>
      </div>
    );
  }

  // ── Banned ─────────────────────────────────
  if (isBanned) {
    return (
      <div className="upload-page">
        <div
          className="wallet-warning"
          style={{ borderColor: "var(--error)", color: "var(--error)" }}
        >
          ⛔ Your wallet has been banned from uploading stems.
        </div>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <h1>Upload Stem</h1>
      <p className="subtitle">
        Upload your audio to IPFS and mint it as an NFT
      </p>

      <div className="upload-form">
        {/* Title */}
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

        {/* Audio File */}
        <div className="form-group">
          <label>Audio File</label>
          <div
            className="file-drop-zone"
            onClick={() => document.getElementById("audio-input")?.click()}
          >
            {audioFile ? (
              <div className="file-selected">
                <span className="file-icon">🎵</span>
                <span className="file-name">{audioFile.name}</span>
                <span className="file-size">
                  {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ) : (
              <div className="file-placeholder">
                <span className="file-icon">⬆</span>
                <span>Click to select audio file</span>
                <span className="hint">MP3, WAV, FLAC supported</span>
              </div>
            )}
          </div>
          <input
            id="audio-input"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Prices */}
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

        {/* Royalty */}
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

        {/* Status */}
        {status !== "idle" && (
          <div className={`status ${status}`}>{message}</div>
        )}

        {/* Submit */}
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
