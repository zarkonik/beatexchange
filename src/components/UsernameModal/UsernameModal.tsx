import { useState } from "react";
import { useUser } from "../../context/UserContext";
import type { UserRole } from "../../services/firebaseServices";
import "./UsernameModal.css";

const ROLES: { value: UserRole; icon: string; title: string; desc: string }[] =
  [
    {
      value: "buyer",
      icon: "🎧",
      title: "Buyer",
      desc: "Browse and purchase stems, sample packs and soundbanks",
    },
    {
      value: "producer",
      icon: "🎛️",
      title: "Producer",
      desc: "Upload and sell beats, stems, sample packs and soundbanks",
    },
    {
      value: "service_provider",
      icon: "🎤",
      title: "Service Provider",
      desc: "Offer mixing, mastering, vocal recording and other services",
    },
  ];

export default function UsernameModal() {
  const { saveUsername, updateRole, profile } = useUser();

  // if user already has username — start on role step directly
  const [step, setStep] = useState<"role" | "username">(
    profile?.username ? "role" : "role",
  );
  const [role, setRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (r: UserRole) => {
    setRole(r);
    console.log("Role selected:", r);
    console.log("Profile:", profile);

    if (profile?.username) {
      setLoading(true);
      try {
        console.log("Updating role for existing user...");
        await updateRole(r);
        console.log("Role updated successfully!");
      } catch (error: any) {
        console.error("Error updating role:", error);
        setError(error?.message || "Failed to save role");
        setLoading(false);
      }
      return;
    }

    setStep("username");
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!role) {
      setError("Please select a role");
      return;
    }

    setLoading(true);
    setError("");

    const err = await saveUsername(username.trim(), role);
    if (err) {
      setError(err);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="username-modal">
        {/* ── Step 1 — Role Selection ──────── */}
        {step === "role" && (
          <>
            <h2 className="modal-title">
              {profile?.username
                ? "Choose Your Role"
                : "Welcome to BeatExchange"}
            </h2>
            <p className="modal-subtitle">
              {profile?.username
                ? "We need to know your role to personalize your experience"
                : "Choose your role to get started"}
            </p>

            <div className="role-grid">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  className="role-card"
                  onClick={() => handleRoleSelect(r.value)}
                >
                  <span className="role-icon">{r.icon}</span>
                  <span className="role-title">{r.title}</span>
                  <span className="role-desc">{r.desc}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Step 2 — Username ────────────── */}
        {step === "username" && (
          <>
            <button className="modal-back" onClick={() => setStep("role")}>
              ← Back
            </button>

            <div className="role-selected">
              {ROLES.find((r) => r.value === role)?.icon}{" "}
              {ROLES.find((r) => r.value === role)?.title}
            </div>

            <h2 className="modal-title">Choose Your Username</h2>
            <p className="modal-subtitle">
              This will be your public identity on Beat Exchange
            </p>

            <input
              type="text"
              className="modal-input"
              placeholder="Enter username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />

            {error && <p className="modal-error">{error}</p>}

            <button
              className="modal-btn"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Get Started →"}
            </button>

            <p className="modal-hint">
              Letters and numbers only — max 20 characters
            </p>
          </>
        )}
      </div>
    </div>
  );
}
