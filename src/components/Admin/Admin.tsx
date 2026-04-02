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
import {
  getAllSamplePacksOnly,
  getAllSoundbanks,
  deletePack,
  hideStem,
  getHiddenStemIds,
  unhideStem,
} from "../../services/firebaseServices";
import type { SamplePack, Soundbank } from "../../services/firebaseServices";
import { deleteFromR2 } from "../../services/r2";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/contract";
import { unpinFromPinata } from "../../services/pinata";
import { updateUserRole } from "../../services/firebaseServices";
import type { UserRole } from "../../services/firebaseServices";

type AdminTab =
  | "overview"
  | "services"
  | "stems"
  | "packs"
  | "soundbanks"
  | "users"
  | "banned";

export default function Admin() {
  const { isConnected, address } = useWallet();

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [bannedWallets, setBannedWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banReasons, setBanReasons] = useState<Record<string, string>>({});

  const hasAccess = isConnected && isAdminWallet(address);

  const { provider } = useWallet();

  const [samplePacks, setSamplePacks] = useState<SamplePack[]>([]);
  const [soundbanks, setSoundbanks] = useState<Soundbank[]>([]);
  const [stems, setStems] = useState<any[]>([]);
  const [hiddenIds, setHiddenIds] = useState<number[]>([]);

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

  const loadStems = async () => {
    try {
      const p = provider || new BrowserProvider(window.ethereum);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, p);
      const count = Number(await contract.stemCount());
      const hidden = await getHiddenStemIds();
      setHiddenIds(hidden);
      const list = [];
      for (let i = 0; i < count; i++) {
        const stem = await contract.getStem(i);
        list.push({
          id: i,
          title: stem.title,
          producer: stem.producer,
          ipfsHash: stem.ipfsHash,
        });
      }
      setStems(list);
    } catch (error) {
      console.error("Failed to load stems:", error);
    }
  };

  const handleRoleChange = async (walletAddress: string, role: UserRole) => {
    await updateUserRole(walletAddress, role);
    await loadData();
  };

  const loadPacks = async () => {
    const [packs, banks] = await Promise.all([
      getAllSamplePacksOnly(),
      getAllSoundbanks(),
    ]);
    setSamplePacks(packs);
    setSoundbanks(banks);
  };

  useEffect(() => {
    if (isAdminWallet(address)) {
      loadData();
      loadStems(); // ✅ add
      loadPacks(); // ✅ add
    }
  }, [address]);

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

  const handleHideStem = async (stem: {
    id: number;
    title: string;
    ipfsHash: string;
  }) => {
    if (
      !confirm(`Hide "${stem.title}" from marketplace and free Pinata storage?`)
    )
      return;
    try {
      await hideStem(stem.id);

      // try to unpin — ignore error if already unpinned
      try {
        await unpinFromPinata(stem.ipfsHash);
      } catch {
        // file already deleted from Pinata — that's fine
      }

      await loadStems();
    } catch (error: any) {
      alert("Failed: " + error.message);
    }
  };

  const handleUnhideStem = async (stemId: number) => {
    await unhideStem(stemId);
    await loadStems();
  };

  const handleDeletePack = async (pack: SamplePack | Soundbank) => {
    if (!confirm(`Delete "${pack.title}"? This cannot be undone.`)) return;
    try {
      if (pack.fileUrl) await deleteFromR2(pack.fileUrl);
      await deletePack(pack.id!);
      await loadPacks();
    } catch (error: any) {
      alert("Delete failed: " + error.message);
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
        {(
          [
            "overview",
            "services",
            "stems",
            "packs",
            "soundbanks",
            "users",
            "banned",
            "roles",
          ] as AdminTab[]
        ).map((tab) => (
          <button
            key={tab}
            className={`admin-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
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

          {/* ── Stems Tab ─────────────────────────── */}
          {activeTab === "stems" &&
            (stems.length === 0 ? (
              <p className="loading-text">No stems found</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Producer</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stems.map((stem) => (
                    <tr key={stem.id}>
                      <td>{stem.id}</td>
                      <td>{stem.title}</td>
                      <td>{shortAddress(stem.producer)}</td>
                      <td>
                        {hiddenIds.includes(stem.id) ? (
                          <span
                            style={{
                              color: "var(--error)",
                              fontSize: "0.7rem",
                              letterSpacing: "1px",
                            }}
                          >
                            HIDDEN
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--success)",
                              fontSize: "0.7rem",
                              letterSpacing: "1px",
                            }}
                          >
                            VISIBLE
                          </span>
                        )}
                      </td>
                      <td>
                        {hiddenIds.includes(stem.id) ? (
                          <button
                            className="btn-admin-unban"
                            onClick={() => handleUnhideStem(stem.id)}
                          >
                            Unhide
                          </button>
                        ) : (
                          <button
                            className="btn-admin-delete"
                            onClick={() => handleHideStem(stem)}
                          >
                            Hide
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}

          {/* ── Sample Packs Tab ──────────────────── */}
          {activeTab === "packs" &&
            (samplePacks.length === 0 ? (
              <p className="loading-text">No sample packs found</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Producer</th>
                    <th>Price</th>
                    <th>Size</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {samplePacks.map((pack) => (
                    <tr key={pack.id}>
                      <td>{pack.title}</td>
                      <td>{shortAddress(pack.producer)}</td>
                      <td>{pack.price} ETH</td>
                      <td>{pack.fileSize}</td>
                      <td>
                        <button
                          className="btn-admin-delete"
                          onClick={() => handleDeletePack(pack)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}

          {/* ── Soundbanks Tab ────────────────────── */}
          {activeTab === "soundbanks" &&
            (soundbanks.length === 0 ? (
              <p className="loading-text">No soundbanks found</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Producer</th>
                    <th>Instrument</th>
                    <th>Price</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {soundbanks.map((bank) => (
                    <tr key={bank.id}>
                      <td>{bank.title}</td>
                      <td>{shortAddress(bank.producer)}</td>
                      <td>{bank.instrument}</td>
                      <td>{bank.price} ETH</td>
                      <td>
                        <button
                          className="btn-admin-delete"
                          onClick={() => handleDeletePack(bank)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ))}

          {/* ── Users ─────────────────────────── */}
          {activeTab === "users" && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Wallet</th>
                  <th>Role</th>
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
                      <select
                        value={user.role || "buyer"}
                        onChange={(e) =>
                          handleRoleChange(
                            user.walletAddress,
                            e.target.value as UserRole,
                          )
                        }
                        style={{
                          background: "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius)",
                          color: "var(--text)",
                          fontFamily: "Courier New, monospace",
                          fontSize: "0.65rem",
                          padding: "0.3rem 0.5rem",
                          letterSpacing: "1px",
                          cursor: "pointer",
                        }}
                      >
                        <option value="buyer">Buyer</option>
                        <option value="producer">Producer</option>
                        <option value="service_provider">
                          Service Provider
                        </option>
                      </select>
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
