import { useWallet } from "../../context/WalletContext";
import { useNavigation } from "../../context/NavigationContext";
import "./Landing.css";

const STEPS = [
  {
    icon: "🔌",
    title: "Connect Wallet",
    desc:
      "Connect your MetaMask (Google Chrome extension) or any Web3 wallet. For mobile, I recommend also to use MetaMask wallet (Not an ad here :D). Just download Metamask for Android or IOS and be patient! No email or password needed — your wallet is your identity. You need to setup a wallet to be able to access all features of the website. Go to Connect wallet button at the top right corner and choose MetaMask." +
      "Once installed, refresh the website so it can recognise installed Metamask. When you connect on a mobile wait a little when connecting until it says that you can return to the website.",
  },
  {
    icon: "🚰",
    title: "Get Free Test Ethereum crypto currency",
    desc:
      "Need ETH to get started? Get free Sepolia test ETH with your Google account on the official Google Faucet. Just go to the link below and and choose Sepolia Network" +
      " if not already chosen. Copy your MetaMask account address and you will get 0.05ETH that you can use for transactions.",
    url: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
  },
  {
    icon: "🎵",
    title: "Browse & Preview",
    desc: "Explore stems, sample packs and soundbanks from producers worldwide. Preview before you buy.",
  },
  {
    icon: "⚡",
    title: "Buy Instantly",
    desc: "Purchase licenses with ETH. Transactions confirm in seconds — no waiting, no middlemen.",
  },
  {
    icon: "📜",
    title: "Own Forever",
    desc: "Your license is recorded on the blockchain permanently. Download anytime, use with confidence.",
  },
];

export default function Landing() {
  const { isConnected, connectWallet } = useWallet();
  const { navigateTo } = useNavigation();

  return (
    <div className="landing-page">
      {/* ── Hero ────────────────────────────── */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Web3 Music Marketplace
          </div>

          <h1 className="hero-title">
            The Future of
            <br />
            <span className="hero-title-accent">Music Licensing</span>
          </h1>

          <p className="hero-subtitle">
            Buy and sell stems, sample packs and soundbanks directly on the
            blockchain. No middlemen. Instant payments. Permanent ownership.
          </p>

          <div className="hero-buttons">
            <button
              className="btn-hero-primary"
              onClick={() => navigateTo("marketplace")}
            >
              Browse Marketplace
            </button>
            {!isConnected ? (
              <button className="btn-hero-secondary" onClick={connectWallet}>
                Connect Wallet
              </button>
            ) : (
              <button
                className="btn-hero-secondary"
                onClick={() => navigateTo("upload")}
              >
                Upload Stem
              </button>
            )}
          </div>
        </div>

        <div className="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-arrow" />
        </div>
      </section>

      {/* ── How It Works ────────────────────── */}
      <section className="how-it-works">
        <p className="section-label">Simple but yet not so simple Process :D</p>
        <h2 className="section-title">How It Works</h2>

        <div className="steps">
          {STEPS.map((step, index) => (
            <div key={index} className="step-card">
              <span className="step-number">0{index + 1}</span>
              <span className="step-icon">{step.icon}</span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
              {step.url && (
                <a
                  href={step.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--accent)",
                    letterSpacing: "1px",
                    wordBreak: "break-all",
                    marginTop: "0.5rem",
                    textDecoration: "none",
                    borderBottom: "1px solid var(--accent)",
                    paddingBottom: "1px",
                  }}
                >
                  → Open Faucet
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ──────────────────────── */}
      <section className="landing-cta">
        <h2 className="cta-title">
          Ready To <span>Start</span>?
        </h2>
        <p className="cta-subtitle">
          Join producers and artists already using BeatExchange
        </p>
        <div className="hero-buttons">
          <button
            className="btn-hero-primary"
            onClick={() => navigateTo("marketplace")}
          >
            Go To Marketplace
          </button>
          {!isConnected && (
            <button className="btn-hero-secondary" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
