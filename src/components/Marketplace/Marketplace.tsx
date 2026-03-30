import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { useCart } from "../../context/CartContext";
import { useNavigation } from "../../context/NavigationContext";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/contract";
import { ipfsToUrl } from "../../services/pinata";
import {
  getAllSamplePacksOnly,
  getAllSoundbanks,
  hasPackPurchase,
} from "../../services/firebaseServices";
import type { SamplePack, Soundbank } from "../../services/firebaseServices";
import AudioPlayer from "../AudioPlayer/AudioPlayer";
import "./Marketplace.css";

type MarketTab = "stems" | "sample-packs" | "soundbanks";

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

  const [activeTab, setActiveTab] = useState<MarketTab>("stems");
  const [stems, setStems] = useState<Stem[]>([]);
  const [samplePacks, setSamplePacks] = useState<SamplePack[]>([]);
  const [soundbanks, setSoundbanks] = useState<Soundbank[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [licenses, setLicenses] = useState<Record<number, boolean>>({});
  const [purchases, setPurchases] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      if (activeTab === "stems" && stems.length > 0) checkLicenses();
      if (activeTab === "sample-packs" && samplePacks.length > 0)
        checkPackPurchases(samplePacks);
      if (activeTab === "soundbanks" && soundbanks.length > 0)
        checkPackPurchases(soundbanks);
    }
  }, [isConnected, address, activeTab, stems, samplePacks, soundbanks]);

  const getContract = async (withSigner = false) => {
    const p = provider || new BrowserProvider(window.ethereum);
    if (withSigner) {
      const signer = await p.getSigner();
      return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    }
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, p);
  };

  const loadAll = async () => {
    try {
      setLoading(true);

      // load all three separately
      const [packsData, banksData] = await Promise.all([
        getAllSamplePacksOnly(),
        getAllSoundbanks(),
      ]);

      setSamplePacks(packsData);
      setSoundbanks(banksData);

      // load stems separately
      await loadStems();
    } catch (error) {
      console.error("Failed to load:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadStems = async () => {
    const contract = await getContract();
    const count = Number(await contract.stemCount());
    const list: Stem[] = [];
    for (let i = 0; i < count; i++) {
      const stem = await contract.getStem(i);
      list.push({
        id: i,
        producer: stem.producer,
        title: stem.title,
        ipfsHash: stem.ipfsHash,
        personalPrice: stem.personalPrice,
        commercialPrice: stem.commercialPrice,
        royaltyRate: Number(stem.royaltyRate),
      });
    }
    setStems(list);
  };

  const checkLicenses = async () => {
    const contract = await getContract();
    const result: Record<number, boolean> = {};
    for (const stem of stems) {
      result[stem.id] = await contract.hasLicense(stem.id, address);
    }
    setLicenses(result);
  };

  const checkPackPurchases = async (packs: (SamplePack | Soundbank)[]) => {
    const result: Record<string, boolean> = {};
    for (const pack of packs) {
      if (pack.id) {
        result[pack.id] = await hasPackPurchase(pack.id, address);
      }
    }
    setPurchases((prev) => ({ ...prev, ...result }));
  };

  const downloadStem = async (stem: Stem) => {
    try {
      setDownloadingId(stem.id);
      const response = await fetch(ipfsToUrl(stem.ipfsHash));
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
      alert("Download failed");
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadPack = async (pack: SamplePack | Soundbank) => {
    const link = document.createElement("a");
    link.href = pack.fileUrl;
    link.download = `${pack.title}.zip`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const isOwnStem = (stem: Stem) =>
    address.toLowerCase() === stem.producer.toLowerCase();

  const isOwnPack = (pack: SamplePack | Soundbank) =>
    address.toLowerCase() === pack.producer.toLowerCase();

  return (
    <div className="marketplace-page">
      <h1>Marketplace</h1>
      <p className="subtitle">
        Browse and license stems, sample packs and soundbanks
      </p>

      {/* ── Tabs ────────────────────────────── */}
      <div className="market-tabs">
        <button
          className={`market-tab ${activeTab === "stems" ? "active" : ""}`}
          onClick={() => setActiveTab("stems")}
        >
          Stems ({stems.length})
        </button>
        <button
          className={`market-tab ${activeTab === "sample-packs" ? "active" : ""}`}
          onClick={() => setActiveTab("sample-packs")}
        >
          Sample Packs ({samplePacks.length})
        </button>
        <button
          className={`market-tab ${activeTab === "soundbanks" ? "active" : ""}`}
          onClick={() => setActiveTab("soundbanks")}
        >
          Soundbanks ({soundbanks.length})
        </button>
      </div>

      {loading ? (
        <p className="loading-text">⏳ Loading...</p>
      ) : (
        <>
          {/* ── Stems Tab ─────────────────────── */}
          {activeTab === "stems" &&
            (stems.length === 0 ? (
              <p className="empty-text">No stems uploaded yet. Be the first!</p>
            ) : (
              <>
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
                          <span className="royalty-badge">
                            {stem.royaltyRate}%
                          </span>
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
                                : "↓ Download Stem"}
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
                        ) : isInCart(String(stem.id)) ? (
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
                                  id: String(stem.id),
                                  type: "stem",
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
                                  id: String(stem.id),
                                  type: "stem",
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
                              + Commercial — {formatEther(stem.commercialPrice)}{" "}
                              ETH
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ))}

          {/* ── Sample Packs Tab ───────────────── */}
          {activeTab === "sample-packs" &&
            (samplePacks.length === 0 ? (
              <p className="empty-text">No sample packs yet. Be the first!</p>
            ) : (
              <div className="stems-grid">
                {samplePacks.map((pack) => (
                  <div key={pack.id} className="stem-card">
                    <div className="stem-card-header">
                      <span className="stem-title">{pack.title}</span>
                      <span className="stem-id">🎵</span>
                    </div>
                    <p className="stem-producer">
                      By <span>{shortAddress(pack.producer)}</span>
                    </p>
                    <AudioPlayer
                      ipfsHash={
                        pack.previewUrl.includes("/ipfs/")
                          ? pack.previewUrl.split("/ipfs/")[1]
                          : pack.previewUrl
                      }
                    />
                    <div className="stem-prices">
                      <div className="price-row-card">
                        <span className="price-label">Genre</span>
                        <span className="price-value">{pack.genre}</span>
                      </div>
                      {pack.bpm && (
                        <div className="price-row-card">
                          <span className="price-label">BPM</span>
                          <span className="price-value">{pack.bpm}</span>
                        </div>
                      )}
                      <div className="price-row-card">
                        <span className="price-label">Files</span>
                        <span className="price-value">
                          {pack.fileCount} samples
                        </span>
                      </div>
                      <div className="price-row-card">
                        <span className="price-label">Size</span>
                        <span className="price-value">{pack.fileSize}</span>
                      </div>
                      <div className="price-row-card">
                        <span className="price-label">Price</span>
                        <span className="price-value">{pack.price} ETH</span>
                      </div>
                    </div>
                    <div className="stem-actions">
                      {purchases[pack.id!] ? (
                        <div className="licensed-actions">
                          <div className="licensed-badge">✅ Purchased</div>
                          <button
                            className="btn-download"
                            onClick={() => downloadPack(pack)}
                          >
                            ↓ Download Pack
                          </button>
                        </div>
                      ) : isOwnPack(pack) ? (
                        <div className="licensed-actions">
                          <div className="licensed-badge">🎛️ Your Pack</div>
                          <button
                            className="btn-download-own"
                            onClick={() => downloadPack(pack)}
                          >
                            ↓ Download Pack
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
                      ) : isInCart(pack.id!) ? (
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
                        <button
                          className="btn-buy-commercial"
                          onClick={() =>
                            addToCart({
                              id: pack.id!,
                              type: "pack",
                              title: pack.title,
                              producer: pack.producer,
                              previewUrl: pack.previewUrl,
                              fileUrl: pack.fileUrl,
                              price: pack.price,
                            })
                          }
                        >
                          + Add to Cart — {pack.price} ETH
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

          {/* ── Soundbanks Tab ────────────────── */}
          {activeTab === "soundbanks" &&
            (soundbanks.length === 0 ? (
              <p className="empty-text">No soundbanks yet. Be the first!</p>
            ) : (
              <div className="stems-grid">
                {soundbanks.map((bank) => (
                  <div key={bank.id} className="stem-card">
                    <div className="stem-card-header">
                      <span className="stem-title">{bank.title}</span>
                      <span className="stem-id">🎹</span>
                    </div>
                    <p className="stem-producer">
                      By <span>{shortAddress(bank.producer)}</span>
                    </p>
                    <AudioPlayer
                      ipfsHash={
                        bank.previewUrl.includes("ipfs")
                          ? bank.previewUrl.split("/ipfs/")[1]
                          : bank.previewUrl
                      }
                    />
                    <div className="stem-prices">
                      <div className="price-row-card">
                        <span className="price-label">Instrument</span>
                        <span className="price-value">{bank.instrument}</span>
                      </div>
                      <div className="price-row-card">
                        <span className="price-label">Format</span>
                        <span className="price-value">{bank.format}</span>
                      </div>
                      <div className="price-row-card">
                        <span className="price-label">Presets</span>
                        <span className="price-value">{bank.presetCount}</span>
                      </div>
                      <div className="price-row-card">
                        <span className="price-label">Size</span>
                        <span className="price-value">{bank.fileSize}</span>
                      </div>
                      <div className="price-row-card">
                        <span className="price-label">Price</span>
                        <span className="price-value">{bank.price} ETH</span>
                      </div>
                    </div>
                    <div className="stem-actions">
                      {purchases[bank.id!] ? (
                        <div className="licensed-actions">
                          <div className="licensed-badge">✅ Purchased</div>
                          <button
                            className="btn-download"
                            onClick={() => downloadPack(bank)}
                          >
                            ↓ Download Soundbank
                          </button>
                        </div>
                      ) : isOwnPack(bank) ? (
                        <div className="licensed-actions">
                          <div className="licensed-badge">
                            🎛️ Your Soundbank
                          </div>
                          <button
                            className="btn-download-own"
                            onClick={() => downloadPack(bank)}
                          >
                            ↓ Download Soundbank
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
                      ) : isInCart(bank.id!) ? (
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
                        <button
                          className="btn-buy-commercial"
                          onClick={() =>
                            addToCart({
                              id: bank.id!,
                              type: "pack",
                              title: bank.title,
                              producer: bank.producer,
                              previewUrl: bank.previewUrl,
                              fileUrl: bank.fileUrl,
                              price: bank.price,
                            })
                          }
                        >
                          + Add to Cart — {bank.price} ETH
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
