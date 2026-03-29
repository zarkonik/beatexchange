import { useState, useEffect } from "react";
import { BrowserProvider, Contract, formatEther } from "ethers";
import { useWallet } from "../../context/WalletContext";
import { useNavigation } from "../../context/NavigationContext";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/contract";
import { ipfsToUrl } from "../../services/pinata";
import AudioPlayer from "../AudioPlayer/AudioPlayer";
import "./MyStems.css";

type Tab = "uploaded" | "licensed";

interface Stem {
  id: number;
  producer: string;
  title: string;
  ipfsHash: string;
  personalPrice: bigint;
  commercialPrice: bigint;
  royaltyRate: number;
}

interface License {
  stemId: number;
  licenseType: number;
  purchasedAt: bigint;
}

export default function MyStems() {
  const { isConnected, address, provider } = useWallet();
  const { navigateTo } = useNavigation();

  const [activeTab, setActiveTab] = useState<Tab>("uploaded");
  const [uploadedStems, setUploadedStems] = useState<Stem[]>([]);
  const [licensedStems, setLicensedStems] = useState<
    { stem: Stem; license: License }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    if (isConnected && address) loadData();
  }, [isConnected, address]);

  const getContract = async () => {
    const p = provider || new BrowserProvider(window.ethereum);
    return new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, p);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      const stemCount = Number(await contract.stemCount());

      const uploaded: Stem[] = [];
      const licensed: { stem: Stem; license: License }[] = [];

      for (let i = 0; i < stemCount; i++) {
        const stem = await contract.getStem(i);

        const stemData: Stem = {
          id: i,
          producer: stem.producer,
          title: stem.title,
          ipfsHash: stem.ipfsHash,
          personalPrice: stem.personalPrice,
          commercialPrice: stem.commercialPrice,
          royaltyRate: Number(stem.royaltyRate),
        };

        // check if I uploaded this stem
        if (stem.producer.toLowerCase() === address.toLowerCase()) {
          uploaded.push(stemData);
        }

        // check if I have a license for this stem
        const hasLic = await contract.hasLicense(i, address);
        if (hasLic) {
          const lic = await contract.getLicense(i, address);
          licensed.push({
            stem: stemData,
            license: {
              stemId: Number(lic.stemId),
              licenseType: Number(lic.licenseType),
              purchasedAt: lic.purchasedAt,
            },
          });
        }
      }

      setUploadedStems(uploaded);
      setLicensedStems(licensed);
    } catch (error) {
      console.error("Failed to load stems:", error);
    } finally {
      setLoading(false);
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

  // ── Not connected ──────────────────────────
  if (!isConnected) {
    return (
      <div className="mystems-page">
        <div className="wallet-warning">
          🔌 Connect your wallet to view your stems
        </div>
      </div>
    );
  }

  return (
    <div className="mystems-page">
      <h1>My Stems</h1>
      <p className="subtitle">Manage your uploaded and licensed stems</p>

      {/* ── Tabs ────────────────────────────── */}
      <div className="mystems-tabs">
        <button
          className={`mystems-tab ${activeTab === "uploaded" ? "active" : ""}`}
          onClick={() => setActiveTab("uploaded")}
        >
          Uploaded ({uploadedStems.length})
        </button>
        <button
          className={`mystems-tab ${activeTab === "licensed" ? "active" : ""}`}
          onClick={() => setActiveTab("licensed")}
        >
          Licensed ({licensedStems.length})
        </button>
      </div>

      {loading ? (
        <p className="loading-text">⏳ Loading your stems...</p>
      ) : (
        <>
          {/* ── Uploaded Tab ──────────────────── */}
          {activeTab === "uploaded" &&
            (uploadedStems.length === 0 ? (
              <div className="mystems-empty">
                <p>You haven't uploaded any stems yet</p>
                <button
                  className="btn-mystems-action"
                  onClick={() => navigateTo("upload")}
                >
                  Upload Your First Stem
                </button>
              </div>
            ) : (
              <div className="mystems-grid">
                {uploadedStems.map((stem) => (
                  <div key={stem.id} className="mystem-card">
                    <div className="mystem-card-header">
                      <span className="mystem-title">{stem.title}</span>
                      <span className="mystem-id">#{stem.id}</span>
                    </div>

                    <AudioPlayer ipfsHash={stem.ipfsHash} />

                    <div className="mystem-prices">
                      <div className="mystem-price-row">
                        <span className="mystem-price-label">Personal</span>
                        <span className="mystem-price-value">
                          {formatEther(stem.personalPrice)} ETH
                        </span>
                      </div>
                      <div className="mystem-price-row">
                        <span className="mystem-price-label">Commercial</span>
                        <span className="mystem-price-value">
                          {formatEther(stem.commercialPrice)} ETH
                        </span>
                      </div>
                      <div className="mystem-price-row">
                        <span className="mystem-price-label">Royalty</span>
                        <span className="mystem-royalty-badge">
                          {stem.royaltyRate}%
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn-mystem-download"
                      onClick={() => downloadStem(stem)}
                      disabled={downloadingId === stem.id}
                    >
                      {downloadingId === stem.id
                        ? "⏳ Downloading..."
                        : "↓ Download"}
                    </button>
                  </div>
                ))}
              </div>
            ))}

          {/* ── Licensed Tab ──────────────────── */}
          {activeTab === "licensed" &&
            (licensedStems.length === 0 ? (
              <div className="mystems-empty">
                <p>You haven't licensed any stems yet</p>
                <button
                  className="btn-mystems-action"
                  onClick={() => navigateTo("marketplace")}
                >
                  Browse Marketplace
                </button>
              </div>
            ) : (
              <div className="mystems-grid">
                {licensedStems.map(({ stem, license }) => (
                  <div key={stem.id} className="mystem-card">
                    <div className="mystem-card-header">
                      <span className="mystem-title">{stem.title}</span>
                      <span className="mystem-id">#{stem.id}</span>
                    </div>

                    <span
                      className={`license-type-badge ${license.licenseType === 0 ? "personal" : "commercial"}`}
                    >
                      {license.licenseType === 0
                        ? "Personal License"
                        : "Commercial License"}
                    </span>

                    <AudioPlayer ipfsHash={stem.ipfsHash} />

                    <div className="mystem-prices">
                      <div className="mystem-price-row">
                        <span className="mystem-price-label">Paid</span>
                        <span className="mystem-price-value">
                          {formatEther(
                            license.licenseType === 0
                              ? stem.personalPrice
                              : stem.commercialPrice,
                          )}{" "}
                          ETH
                        </span>
                      </div>
                      <div className="mystem-price-row">
                        <span className="mystem-price-label">Royalty</span>
                        <span className="mystem-royalty-badge">
                          {stem.royaltyRate}%
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn-mystem-download"
                      onClick={() => downloadStem(stem)}
                      disabled={downloadingId === stem.id}
                    >
                      {downloadingId === stem.id
                        ? "⏳ Downloading..."
                        : "↓ Download"}
                    </button>
                  </div>
                ))}
              </div>
            ))}
        </>
      )}
    </div>
  );
}
