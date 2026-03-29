import { useState, useRef } from "react";
import { useWallet } from "../../context/WalletContext";
import { useUser } from "../../context/UserContext";
import { compressImage } from "../../utils/imageUtils";
import "./Profile.css";

export default function Profile() {
  const { isConnected, address } = useWallet();
  const { profile, avatar, updateAvatar } = useUser();

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setStatus("error");
      setMessage("Please select an image file");
      return;
    }

    try {
      setStatus("loading");
      setMessage("Compressing and uploading avatar...");
      const base64 = await compressImage(file);
      await updateAvatar(base64);
      setStatus("success");
      setMessage("✅ Avatar updated successfully!");
    } catch (error: any) {
      setStatus("error");
      setMessage(error?.message || "Failed to upload avatar");
    }
  };

  if (!isConnected) {
    return (
      <div className="profile-page">
        <div className="wallet-warning">
          🔌 Connect your wallet to view your profile
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      <p className="subtitle">Manage your BeatExchange profile</p>

      <div className="profile-card">
        {/* ── Avatar Section ──────────────────── */}
        <div className="avatar-section">
          {/* Avatar — click to preview full size */}
          <div className="avatar-wrapper">
            {avatar ? (
              <img
                src={avatar}
                alt="avatar"
                className="avatar-img"
                onClick={() => setPreviewOpen(true)}
                title="Click to preview"
              />
            ) : (
              <div className="avatar-placeholder">🎛️</div>
            )}
            <button
              className="avatar-upload-btn"
              onClick={handleAvatarClick}
              title="Upload avatar"
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: "none" }}
            />
          </div>

          <div className="avatar-info">
            <span className="avatar-username">
              {profile?.username || "No username"}
            </span>
            <span className="avatar-wallet">{shortAddress}</span>
            <span className="avatar-hint">
              Click the camera icon to update avatar
            </span>
            {avatar && (
              <span
                className="avatar-hint"
                style={{ color: "var(--accent)", cursor: "pointer" }}
                onClick={() => setPreviewOpen(true)}
              >
                Click avatar to preview full size
              </span>
            )}
          </div>
        </div>

        <hr className="profile-divider" />

        {/* ── Info Section ─────────────────────── */}
        <div className="profile-form">
          <div className="form-group">
            <label>Username</label>
            <input type="text" value={profile?.username || ""} disabled />
          </div>

          <div className="form-group">
            <label>Wallet Address</label>
            <input type="text" value={address} disabled />
          </div>
        </div>

        {/* Status */}
        {status !== "idle" && (
          <div className={`status ${status}`}>{message}</div>
        )}

        {/* Upload Button */}
        <button
          className="btn-save-profile"
          onClick={handleAvatarClick}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Uploading..." : "📷 Change Avatar"}
        </button>
      </div>

      {/* ── Full Size Preview Modal ──────────── */}
      {previewOpen && avatar && (
        <div
          className="avatar-preview-overlay"
          onClick={() => setPreviewOpen(false)}
        >
          <div className="avatar-preview-modal">
            <img
              src={avatar}
              alt="avatar preview"
              className="avatar-preview-img"
            />
            <button
              className="avatar-preview-close"
              onClick={() => setPreviewOpen(false)}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
