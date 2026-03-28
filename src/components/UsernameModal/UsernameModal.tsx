import { useState } from "react";
import { useUser } from "../../context/UserContext";
import "./UsernameModal.css";

export default function UsernameModal() {
  const { showUsernameModal, saveUsername } = useUser();

  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!showUsernameModal) return null;

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }

    setLoading(true);
    setError("");

    const errorMsg = await saveUsername(username.trim());
    if (errorMsg) {
      setError(errorMsg);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>👋 Welcome!</h2>
          <p>
            You're connecting for the first time. Choose a username so others
            can recognize you on BeatExchange.
          </p>
        </div>

        <div className="modal-input-group">
          <label>Username</label>
          <input
            className="modal-input"
            type="text"
            placeholder="e.g. DJZarko"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            autoFocus
          />
          <span className="modal-hint">
            Letters and numbers only — max 20 characters
          </span>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <button className="modal-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Set Username →"}
        </button>
      </div>
    </div>
  );
}
