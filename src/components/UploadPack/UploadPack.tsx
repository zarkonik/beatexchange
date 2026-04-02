import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { useNavigation } from "../../context/NavigationContext";
import { uploadToR2 } from "../../services/r2";
import { uploadToPinata, ipfsToUrl } from "../../services/pinata";
import {
  createSamplePack,
  isWalletBanned,
} from "../../services/firebaseServices";
import type { SamplePack, Soundbank } from "../../services/firebaseServices";
import "./UploadPack.css";
import { useUser } from "../../context/UserContext";

type PackType = "Sample Pack" | "Soundbank";

export default function UploadPack() {
  const { isConnected, address } = useWallet();
  const { navigateTo } = useNavigation();
  const { profile } = useUser();
  const [isBanned, setIsBanned] = useState(false);

  // ── Pack type ──────────────────────────────
  const [packType, setPackType] = useState<PackType>("Sample Pack");

  // ── Common fields ──────────────────────────
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [fileSize, setFileSize] = useState("");

  // ── Sample Pack specific ───────────────────
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState("");
  const [fileCount, setFileCount] = useState("");

  // ── Soundbank specific ─────────────────────
  const [instrument, setInstrument] = useState("");
  const [format, setFormat] = useState("");
  const [presetCount, setPresetCount] = useState("");

  // ── Files ──────────────────────────────────
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  // ── Status ─────────────────────────────────
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ check file extension
    const validExtensions = [".zip", ".rar"];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setStatus("error");
      setMessage("❌ Only ZIP and RAR files are supported");
      e.target.value = ""; // reset input
      return;
    }

    setZipFile(file);
    setStatus("idle");
    setMessage("");
  };

  useEffect(() => {
    const checkBan = async () => {
      if (isConnected && address) {
        const banned = await isWalletBanned(address);
        setIsBanned(banned);
      }
    };
    checkBan();
  }, [isConnected, address]);

  const handlePreviewChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setStatus("error");
      setMessage("Preview must be an audio file");
      return;
    }
    setPreviewFile(file);
    setStatus("idle");
  };

  const handleUpload = async () => {
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
      if (!price) {
        setStatus("error");
        setMessage("Price is required");
        return;
      }
      if (!zipFile) {
        setStatus("error");
        setMessage("ZIP file is required");
        return;
      }
      if (!previewFile) {
        setStatus("error");
        setMessage("Preview audio is required");
        return;
      }

      if (packType === "Sample Pack") {
        if (!genre) {
          setStatus("error");
          setMessage("Genre is required");
          return;
        }
        if (!fileCount) {
          setStatus("error");
          setMessage("File count is required");
          return;
        }
      } else {
        if (!instrument) {
          setStatus("error");
          setMessage("Instrument is required");
          return;
        }
        if (!format) {
          setStatus("error");
          setMessage("Format is required");
          return;
        }
        if (!presetCount) {
          setStatus("error");
          setMessage("Preset count is required");
          return;
        }
      }

      setStatus("loading");

      // step 1 — upload preview to IPFS
      setMessage("Uploading audio preview to IPFS...");
      setProgress(10);
      const previewCid = await uploadToPinata(previewFile);
      const previewUrl = ipfsToUrl(previewCid);
      setProgress(30);

      // step 2 — upload ZIP to Backblaze
      setMessage("Uploading ZIP file to Backblaze...");
      const folder = packType === "Sample Pack" ? "sample-packs" : "soundbanks";
      const fileUrl = await uploadToR2(zipFile, folder);
      setProgress(80);

      // step 3 — save to Firebase
      setMessage("Saving listing to database...");

      if (packType === "Sample Pack") {
        const pack: Omit<SamplePack, "id" | "createdAt"> = {
          producer: address.toLowerCase(),
          title,
          description,
          category: "Sample Pack",
          price,
          previewUrl,
          fileUrl,
          fileSize: fileSize || `${(zipFile.size / 1024 / 1024).toFixed(0)}MB`,
          fileCount: Number(fileCount),
          genre,
          bpm: bpm || undefined,
        };
        await createSamplePack(pack);
      } else {
        const bank: Omit<Soundbank, "id" | "createdAt"> = {
          producer: address.toLowerCase(),
          title,
          description,
          category: "Soundbank",
          price,
          previewUrl,
          fileUrl,
          fileSize: fileSize || `${(zipFile.size / 1024 / 1024).toFixed(0)}MB`,
          instrument,
          format,
          presetCount: Number(presetCount),
        };
        await createSamplePack(bank as any);
      }

      setProgress(100);
      setStatus("success");
      setMessage(`✅ ${packType} "${title}" uploaded successfully!`);

      // reset
      setTitle("");
      setDescription("");
      setPrice("");
      setFileSize("");
      setGenre("");
      setBpm("");
      setFileCount("");
      setInstrument("");
      setFormat("");
      setPresetCount("");
      setZipFile(null);
      setPreviewFile(null);
      setProgress(0);
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || "Something went wrong");
      setProgress(0);
    }
  };

  if (!isConnected) {
    return (
      <div className="upload-pack-page">
        <div className="wallet-warning">
          🔌 Connect your wallet to upload packs
        </div>
      </div>
    );
  }
  if (isBanned) {
    return (
      <div className="upload-pack-page">
        <div
          className="wallet-warning"
          style={{ borderColor: "var(--error)", color: "var(--error)" }}
        >
          ⛔ Your wallet has been banned from uploading packs.
        </div>
      </div>
    );
  }

  if (profile?.role !== "producer") {
    return (
      <div className="upload-pack-page">
        <div
          className="wallet-warning"
          style={{ borderColor: "var(--error)", color: "var(--error)" }}
        >
          ⛔ Only Producers can upload packs
        </div>
      </div>
    );
  }
  return (
    <div className="upload-pack-page">
      <h1>Upload Pack</h1>
      <p className="subtitle">Sell your sample packs and soundbanks</p>

      <div className="upload-pack-form">
        {/* ── Pack Type ───────────────────────── */}
        <div className="form-group">
          <label>Pack Type</label>
          <div className="type-selector">
            <button
              className={`type-btn ${packType === "Sample Pack" ? "active" : ""}`}
              onClick={() => setPackType("Sample Pack")}
            >
              <span className="type-btn-icon">🎵</span>
              Sample Pack
            </button>
            <button
              className={`type-btn ${packType === "Soundbank" ? "active" : ""}`}
              onClick={() => setPackType("Soundbank")}
            >
              <span className="type-btn-icon">🎹</span>
              Soundbank
            </button>
          </div>
        </div>

        {/* ── Title ───────────────────────────── */}
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            placeholder={
              packType === "Sample Pack"
                ? "e.g. Dark Trap Essentials Vol.1"
                : "e.g. Cinematic Piano Collection"
            }
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* ── Description ─────────────────────── */}
        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Describe what's included in th  pack..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={1000}
          />
          <span className="hint">{description.length}/1000</span>
        </div>

        {/* ── Sample Pack Fields ───────────────── */}
        {packType === "Sample Pack" && (
          <>
            <div className="two-col">
              <div className="form-group">
                <label>Genre</label>
                <input
                  type="text"
                  placeholder="e.g. Trap, Lo-Fi, Techno"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>BPM Range (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 140 or 120-140"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Number of Files</label>
              <input
                type="number"
                placeholder="e.g. 150"
                value={fileCount}
                onChange={(e) => setFileCount(e.target.value)}
                min="1"
              />
              <span className="hint">Total number of samples in the pack</span>
            </div>
          </>
        )}

        {/* ── Soundbank Fields ─────────────────── */}
        {packType === "Soundbank" && (
          <>
            <div className="two-col">
              <div className="form-group">
                <label>Instrument</label>
                <input
                  type="text"
                  placeholder="e.g. Piano, Synth, Bass"
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Format</label>
                <input
                  type="text"
                  placeholder="e.g. Kontakt, VST, WAV"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Number of Presets</label>
              <input
                type="number"
                placeholder="e.g. 50"
                value={presetCount}
                onChange={(e) => setPresetCount(e.target.value)}
                min="1"
              />
              <span className="hint">Total number of presets or patches</span>
            </div>
          </>
        )}

        {/* ── Price ───────────────────────────── */}
        <div className="two-col">
          <div className="form-group">
            <label>Price (ETH)</label>
            <input
              type="number"
              placeholder="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.001"
            />
          </div>
          <div className="form-group">
            <label>File Size (optional)</label>
            <input
              type="text"
              placeholder="e.g. 250MB"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
            />
            <span className="hint">Leave empty to auto-detect</span>
          </div>
        </div>

        {/* ── Preview Audio ────────────────────── */}
        <div className="form-group">
          <label>Preview Audio</label>
          <div
            className="file-drop-zone"
            onClick={() => document.getElementById("preview-input")?.click()}
          >
            {previewFile ? (
              <div className="file-selected">
                <span className="file-icon">🎵</span>
                <span className="file-name">{previewFile.name}</span>
                <span className="file-size">
                  {(previewFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ) : (
              <div className="file-placeholder">
                <span className="file-icon">🎵</span>
                <span>Click to select preview audio</span>
                <span className="hint">
                  MP3 or WAV — short teaser of the pack
                </span>
              </div>
            )}
          </div>
          <input
            id="preview-input"
            type="file"
            accept="audio/*"
            onChange={handlePreviewChange}
            style={{ display: "none" }}
          />
        </div>

        {/* ── ZIP File ────────────────────────── */}
        <div className="form-group">
          <label>ZIP File</label>
          <div
            className="file-drop-zone"
            onClick={() => document.getElementById("zip-input")?.click()}
          >
            {zipFile ? (
              <div className="file-selected">
                <span className="file-icon">📦</span>
                <span className="file-name">{zipFile.name}</span>
                <span className="file-size">
                  {(zipFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ) : (
              <div className="file-placeholder">
                <span className="file-icon">📦</span>
                <span>Click to select ZIP or RAR file</span>
                <span className="hint">
                  Only .zip and .rar formats supported
                </span>
              </div>
            )}
          </div>
          <input
            id="zip-input"
            type="file"
            accept=".zip,.rar" // ✅ already correct
            onChange={handleZipChange}
            style={{ display: "none" }}
          />
        </div>

        {/* ── Progress Bar ─────────────────────── */}
        {status === "loading" && (
          <div className="upload-progress">
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-label">
              {progress}% — {message}
            </span>
          </div>
        )}

        {/* ── Status ──────────────────────────── */}
        {status !== "idle" && status !== "loading" && (
          <div className={`status ${status}`}>{message}</div>
        )}

        {/* ── Submit ──────────────────────────── */}
        <button
          className="btn-upload-pack"
          onClick={handleUpload}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Uploading..." : `⬆ Upload ${packType}`}
        </button>

        {status === "success" && (
          <button
            className="btn-upload-pack"
            style={{
              background: "transparent",
              border: "1px solid var(--accent)",
              color: "var(--accent)",
            }}
            onClick={() => navigateTo("marketplace")}
          >
            View in Marketplace
          </button>
        )}
      </div>
    </div>
  );
}
