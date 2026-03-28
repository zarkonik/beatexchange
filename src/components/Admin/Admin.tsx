import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { isAdminWallet } from "../../config/admin";
import {
  getAllServicesAdmin,
  getAllUserProfiles,
  getAllBannedWallets,
  deleteService,
  banWallet,
  unbanWallet,
} from "../../services/firebaseServices";
import type { Service, UserProfile } from "../../services/firebaseServices";
import "./Admin.css";

type AdminTab = "overview" | "services" | "users" | "banned";

export default function Admin() {
  const { isConnected, address } = useWallet();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bannedWallets, setBannedWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banReasons, setBanReasons] = useState<Record<string, string>>({});

  const hasAccess = isConnected && isAdminWallet(address);

  useEffect(() => {
    if (hasAccess) loadData();
  }, [hasAccess]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [servicesData, usersData, bannedData] = await Promise.all([
        getAllServicesAdmin(),
        getAllUserProfiles(),
        getAllBannedWallets(),
      ]);
      setServices(servicesData);
      setUsers(usersData);
      setBannedWallets(bannedData);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Delete this service permanently?")) return;
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleBanWallet = async (walletAddress: string) => {
    const reason = banReasons[walletAddress] || "Violated terms of service";
    if (!confirm(`Ban wallet ${walletAddress}?\nReason: ${reason}`)) return;
    try {
      await banWallet(walletAddress, reason);
      await loadData();
    } catch (error) {
      console.error("Ban failed:", error);
    }
  };

  const handleUnban = async (banId: string) => {
    if (!confirm("Unban this wallet?")) return;
    try {
      await unbanWallet(banId);
      setBannedWallets((prev) => prev.filter((b) => b.id !== banId));
    } catch (error) {
      console.error("Unban failed:", error);
    }
  };

  const isBanned = (wallet: string): boolean =>
    bannedWallets.some((b) => b.walletAddress === wallet.toLowerCase());

  const getUsername = (walletAddress: string): string => {
    const user = users.find(
      (u) => u.walletAddress.toLowerCase() === walletAddress.toLowerCase(),
    );
    return (
      user?.username ||
      `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    );
  };

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (!isConnected) {
    return (
      <div className="admin-page">
        <div className="admin-denied">🔌 Connect your wallet</div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="admin-page">
        <div className="admin-denied">⛔ Access Denied — Admin only</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1>⚙ Admin Panel</h1>
      <p className="subtitle">Manage services, users and banned wallets</p>

      {/* ── Tabs ────────────────────────────── */}
      <div className="admin-tabs">
        {(["overview", "services", "users", "banned"] as AdminTab[]).map(
          (tab) => (
            <button
              key={tab}
              className={`admin-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <p className="loading-text">⏳ Loading admin data...</p>
      ) : (
        <>
          {/* ── Overview ──────────────────────── */}
          {activeTab === "overview" && (
            <div className="admin-stats">
              <div className="admin-stat">
                <span className="admin-stat-value">{services.length}</span>
                <span className="admin-stat-label">Total Services</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-value">{users.length}</span>
                <span className="admin-stat-label">Registered Users</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-value">{bannedWallets.length}</span>
                <span className="admin-stat-label">Banned Wallets</span>
              </div>
              <div className="admin-stat">
                <span className="admin-stat-value">
                  {services.filter((s) => !isBanned(s.walletAddress)).length}
                </span>
                <span className="admin-stat-label">Active Listings</span>
              </div>
            </div>
          )}

          {/* ── Services ──────────────────────── */}
          {activeTab === "services" && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Posted By</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>
                      {service.title}
                      {isBanned(service.walletAddress) && (
                        <span className="banned-badge">BANNED</span>
                      )}
                    </td>
                    <td>{service.category}</td>
                    <td>
                      {getUsername(service.walletAddress)}
                      <span
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "11px",
                          display: "block",
                        }}
                      >
                        {shortAddress(service.walletAddress)}
                      </span>
                    </td>
                    <td>
                      {service.fixedPrice && `$${service.fixedPrice}`}
                      {service.hourlyRate && ` $${service.hourlyRate}/hr`}
                    </td>
                    <td>
                      <button
                        className="btn-admin-delete"
                        onClick={() => handleDeleteService(service.id!)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── Users ─────────────────────────── */}
          {activeTab === "users" && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Wallet</th>
                  <th>Services Posted</th>
                  <th>Status</th>
                  <th>Ban Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.walletAddress}>
                    <td style={{ fontWeight: "bold", color: "var(--accent)" }}>
                      {user.username}
                    </td>
                    <td
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      {shortAddress(user.walletAddress)}
                    </td>
                    <td>
                      {
                        services.filter(
                          (s) =>
                            s.walletAddress.toLowerCase() ===
                            user.walletAddress.toLowerCase(),
                        ).length
                      }
                    </td>
                    <td>
                      {isBanned(user.walletAddress) ? (
                        <span className="banned-badge">BANNED</span>
                      ) : (
                        <span
                          style={{ color: "var(--success)", fontSize: "12px" }}
                        >
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      {!isBanned(user.walletAddress) && (
                        <input
                          className="ban-reason-input"
                          placeholder="Reason..."
                          value={banReasons[user.walletAddress] || ""}
                          onChange={(e) =>
                            setBanReasons((prev) => ({
                              ...prev,
                              [user.walletAddress]: e.target.value,
                            }))
                          }
                        />
                      )}
                    </td>
                    <td>
                      {!isBanned(user.walletAddress) ? (
                        <button
                          className="btn-admin-ban"
                          onClick={() => handleBanWallet(user.walletAddress)}
                        >
                          Ban
                        </button>
                      ) : (
                        <button
                          className="btn-admin-unban"
                          onClick={() => {
                            const ban = bannedWallets.find(
                              (b) =>
                                b.walletAddress ===
                                user.walletAddress.toLowerCase(),
                            );
                            if (ban) handleUnban(ban.id);
                          }}
                        >
                          Unban
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* ── Banned ────────────────────────── */}
          {activeTab === "banned" &&
            (bannedWallets.length === 0 ? (
              <p className="loading-text">No banned wallets</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Wallet</th>
                    <th>Reason</th>
                    <th>Banned At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bannedWallets.map((ban) => (
                    <tr key={ban.id}>
                      <td style={{ fontWeight: "bold", color: "var(--error)" }}>
                        {getUsername(ban.walletAddress)}
                      </td>
                      <td
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        {shortAddress(ban.walletAddress)}
                      </td>
                      <td>{ban.reason}</td>
                      <td>
                        {ban.bannedAt?.toDate
                          ? ban.bannedAt.toDate().toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="btn-admin-unban"
                          onClick={() => handleUnban(ban.id)}
                        >
                          Unban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}
        </>
      )}
    </div>
  );
}
