import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/contract";
import AudioPlayer from "../AudioPlayer/AudioPlayer";
import "./Marketplace.css";

// ── Types ──────────────────────────────────
interface Stem {
  id: number;
  producer: string;
  title: string;
  ipfsHash: string; // ✅ NEW
  personalPrice: bigint;
  commercialPrice: bigint;
  royaltyRate: number;
}

export default function Marketplace() {
  const { isConnected, address } = useWallet();

  const [stems, setStems] = useState<Stem[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<number | null>(null);
  const [licenses, setLicenses] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadStems();
  }, []);

  useEffect(() => {
    if (isConnected && stems.length > 0) checkLicenses();
  }, [isConnected, stems]);

  const getContract = async (withSigner = false) => {
    const provider = new BrowserProvider(window.ethereum);
    if (withSigner) {
      const signer = await provider.getSigner();
      return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  };

  const loadStems = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      const count = await contract.stemCount();
      const total = Number(count);

      const stemList: Stem[] = [];
      for (let i = 0; i < total; i++) {
        const stem = await contract.getStem(i);
        stemList.push({
          id: i,
          producer: stem.producer,
          title: stem.title,
          ipfsHash: stem.ipfsHash, // ✅ NEW
          personalPrice: stem.personalPrice,
          commercialPrice: stem.commercialPrice,
          royaltyRate: Number(stem.royaltyRate),
        });
      }

      setStems(stemList);
    } catch (error) {
      console.error("Failed to load stems:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkLicenses = async () => {
    try {
      const contract = await getContract();
      const result: Record<number, boolean> = {};
      for (const stem of stems) {
        result[stem.id] = await contract.hasLicense(stem.id, address);
      }
      setLicenses(result);
    } catch (error) {
      console.error("Failed to check licenses:", error);
    }
  };

  const buyStem = async (stem: Stem, licenseType: 0 | 1) => {
    try {
      setBuyingId(stem.id);
      const contract = await getContract(true);
      const price =
        licenseType === 0 ? stem.personalPrice : stem.commercialPrice;
      const tx = await contract.buyStem(stem.id, licenseType, { value: price });
      await tx.wait();
      await checkLicenses();
    } catch (error: any) {
      console.error("Purchase failed:", error);
      alert(error?.reason || error?.message || "Purchase failed");
    } finally {
      setBuyingId(null);
    }
  };

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const isOwnStem = (stem: Stem) =>
    address.toLowerCase() === stem.producer.toLowerCase();

  return (
    <div className="marketplace-page">
      <h1>Marketplace</h1>
      <p className="subtitle">
        Browse and license stems from producers around the world
      </p>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-value">{stems.length}</span>
          <span className="stat-label">Total Stems</span>
        </div>
        <div className="stat">
          <span className="stat-value">
            {Object.values(licenses).filter(Boolean).length}
          </span>
          <span className="stat-label">Your Licenses</span>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">⏳ Loading stems...</p>
      ) : stems.length === 0 ? (
        <p className="empty-text">No stems uploaded yet. Be the first!</p>
      ) : (
        <div className="stems-grid">
          {stems.map((stem) => (
            <div key={stem.id} className="stem-card">
              <div className="stem-card-header">
                <span className="stem-title">{stem.title}</span>
                <span className="stem-id">#{stem.id}</span>
              </div>

              <p className="stem-producer">
                By <span>{shortAddress(stem.producer)}</span>
              </p>

              {/* ✅ NEW: Audio Player */}
              <AudioPlayer ipfsHash={stem.ipfsHash} />

              <div className="stem-prices">
                <div className="price-row-card">
                  <span className="price-label">Personal</span>
                  <span className="price-value">
                    {formatEther(stem.personalPrice)} ETH
                  </span>
                </div>
                <div className="price-row-card">
                  <span className="price-label">Commercial</span>
                  <span className="price-value">
                    {formatEther(stem.commercialPrice)} ETH
                  </span>
                </div>
                <div className="price-row-card">
                  <span className="price-label">Royalty</span>
                  <span className="royalty-badge">{stem.royaltyRate}%</span>
                </div>
              </div>

              <div className="stem-actions">
                {licenses[stem.id] ? (
                  <div className="licensed-badge">✅ Licensed</div>
                ) : isOwnStem(stem) ? (
                  <div className="licensed-badge">🎛️ Your Stem</div>
                ) : !isConnected ? (
                  <div
                    className="licensed-badge"
                    style={{
                      color: "var(--text-muted)",
                      borderColor: "var(--border)",
                    }}
                  >
                    Connect wallet to buy
                  </div>
                ) : (
                  <>
                    <button
                      className="btn-buy-personal"
                      onClick={() => buyStem(stem, 0)}
                      disabled={buyingId === stem.id}
                    >
                      {buyingId === stem.id
                        ? "Buying..."
                        : `Personal — ${formatEther(stem.personalPrice)} ETH`}
                    </button>
                    <button
                      className="btn-buy-commercial"
                      onClick={() => buyStem(stem, 1)}
                      disabled={buyingId === stem.id}
                    >
                      {buyingId === stem.id
                        ? "Buying..."
                        : `Commercial — ${formatEther(stem.commercialPrice)} ETH`}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
