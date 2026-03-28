import { useState, useEffect } from "react";
import { Contract, formatEther } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { useCart } from "../../context/CartContext";
import { useNavigation } from "../../context/NavigationContext";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/contract";
import { ipfsToUrl } from "../../services/pinata";
import AudioPlayer from "../AudioPlayer/AudioPlayer";
import "./Marketplace.css";

interface Stem {
  id: number;
  producer: string;
  title: string;
  ipfsHash: string;
  personalPrice: bigint;
  commercialPrice: bigint;
  royaltyRate: number;
}

export default function Marketplace() {
  const { isConnected, address, provider } = useWallet();
  const { addToCart, isInCart } = useCart();
  const { navigateTo } = useNavigation();

  const [stems, setStems] = useState<Stem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [licenses, setLicenses] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadStems();
  }, []);

  useEffect(() => {
    if (isConnected && stems.length > 0) checkLicenses();
  }, [isConnected, stems]);

  const getContract = async (withSigner = false) => {
    if (withSigner) {
      const signer = await provider!.getSigner();
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
          ipfsHash: stem.ipfsHash,
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

  const downloadStem = async (stem: Stem) => {
    try {
      setDownloadingId(stem.id);
      const url = ipfsToUrl(stem.ipfsHash);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${stem.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed — please try again");
    } finally {
      setDownloadingId(null);
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
                  <div className="licensed-actions">
                    <div className="licensed-badge">✅ Licensed</div>
                    <button
                      className="btn-download"
                      onClick={() => downloadStem(stem)}
                      disabled={downloadingId === stem.id}
                    >
                      {downloadingId === stem.id
                        ? "⏳ Downloading..."
                        : "↓ Download Stem"}
                    </button>
                  </div>
                ) : isOwnStem(stem) ? (
                  <div className="licensed-actions">
                    <div className="licensed-badge">🎛️ Your Stem</div>
                    <button
                      className="btn-download-own"
                      onClick={() => downloadStem(stem)}
                      disabled={downloadingId === stem.id}
                    >
                      {downloadingId === stem.id
                        ? "⏳ Downloading..."
                        : "↓ Download Your Stem"}
                    </button>
                  </div>
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
                ) : isInCart(stem.id) ? (
                  <div className="in-cart-actions">
                    <div
                      className="licensed-badge"
                      style={{
                        color: "var(--accent)",
                        borderColor: "var(--accent)",
                      }}
                    >
                      🛒 In Cart
                    </div>
                    <button
                      className="btn-view-cart"
                      onClick={() => navigateTo("cart")}
                    >
                      View Cart
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      className="btn-buy-personal"
                      onClick={() =>
                        addToCart({
                          id: stem.id,
                          title: stem.title,
                          producer: stem.producer,
                          ipfsHash: stem.ipfsHash,
                          personalPrice: stem.personalPrice,
                          commercialPrice: stem.commercialPrice,
                          royaltyRate: stem.royaltyRate,
                          licenseType: 0,
                        })
                      }
                    >
                      + Personal — {formatEther(stem.personalPrice)} ETH
                    </button>
                    <button
                      className="btn-buy-commercial"
                      onClick={() =>
                        addToCart({
                          id: stem.id,
                          title: stem.title,
                          producer: stem.producer,
                          ipfsHash: stem.ipfsHash,
                          personalPrice: stem.personalPrice,
                          commercialPrice: stem.commercialPrice,
                          royaltyRate: stem.royaltyRate,
                          licenseType: 1,
                        })
                      }
                    >
                      + Commercial — {formatEther(stem.commercialPrice)} ETH
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
