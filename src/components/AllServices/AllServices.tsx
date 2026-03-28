import { useState, useEffect } from "react";
import { useWallet } from "../../context/WalletContext";
import { useNavigation } from "../../context/NavigationContext";
import {
  getAllServices,
  getServicesByCategory,
  deleteService,
} from "../../services/firebaseServices";
import type { Service, ServiceCategory } from "../../services/firebaseServices";
import "./AllServices.css";

const CATEGORIES: ServiceCategory[] = [
  "Mixing & Mastering",
  "Beat Making",
  "Sound Design",
  "Vocal Recording",
  "DJ Sets & Remixes",
];

export default function AllServices() {
  const { isConnected, address } = useWallet();
  const { navigateTo } = useNavigation();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | "All">(
    "All",
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadServices();
  }, [activeCategory]);

  const loadServices = async () => {
    try {
      setLoading(true);
      const data =
        activeCategory === "All"
          ? await getAllServices()
          : await getServicesByCategory(activeCategory);
      setServices(data);
    } catch (error) {
      console.error("Failed to load services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      setDeletingId(id);
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete service:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const isOwnService = (service: Service) =>
    isConnected &&
    address.toLowerCase() === service.walletAddress.toLowerCase();

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatPrice = (service: Service) => {
    if (service.pricingType === "fixed") {
      return `$${service.fixedPrice}`;
    }
    if (service.pricingType === "hourly") {
      return `$${service.hourlyRate}/hr`;
    }
    return `$${service.fixedPrice} / $${service.hourlyRate}/hr`;
  };

  return (
    <div className="services-page">
      <h1>Services</h1>
      <p className="subtitle">Hire professionals for your music projects</p>

      {/* ── Top Bar ─────────────────────────── */}
      <div className="services-top-bar">
        {/* Category Filter */}
        <div className="category-filter">
          <button
            className={`category-btn ${activeCategory === "All" ? "active" : ""}`}
            onClick={() => setActiveCategory("All")}
          >
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Post Service Button */}
        {isConnected && (
          <button
            className="btn-post-new"
            onClick={() => navigateTo("post-service")}
          >
            + Post Service
          </button>
        )}
      </div>

      {/* ── Services Grid ───────────────────── */}
      {loading ? (
        <p className="loading-text">⏳ Loading services...</p>
      ) : services.length === 0 ? (
        <div className="empty-text">
          <p>No services found in this category.</p>
          {isConnected && (
            <p style={{ marginTop: "12px" }}>
              Be the first —{" "}
              <span
                style={{ color: "var(--accent)", cursor: "pointer" }}
                onClick={() => navigateTo("post-service")}
              >
                post a service
              </span>
            </p>
          )}
        </div>
      ) : (
        <div className="services-grid">
          {services.map((service) => (
            <div key={service.id} className="service-card">
              {/* Header */}
              <div className="service-card-header">
                <span className="service-category-badge">
                  {service.category}
                </span>
                {isOwnService(service) && (
                  <button
                    className="btn-delete-service"
                    onClick={() => handleDelete(service.id!)}
                    disabled={deletingId === service.id}
                  >
                    {deletingId === service.id ? "..." : "✕"}
                  </button>
                )}
              </div>

              {/* Title */}
              <h3 className="service-title">{service.title}</h3>

              {/* Provider */}
              <p className="service-provider">
                By <span>{shortAddress(service.walletAddress)}</span>
                {isOwnService(service) && " (You)"}
              </p>

              {/* Description */}
              <p className="service-description">{service.description}</p>

              {/* Pricing */}
              <div className="service-pricing">
                {(service.pricingType === "fixed" ||
                  service.pricingType === "both") && (
                  <div className="price-tag">
                    <span className="price-tag-label">Fixed Price</span>
                    <span className="price-tag-value">
                      ${service.fixedPrice}
                    </span>
                    <span className="price-tag-unit">per project</span>
                  </div>
                )}
                {(service.pricingType === "hourly" ||
                  service.pricingType === "both") && (
                  <div className="price-tag">
                    <span className="price-tag-label">Hourly Rate</span>
                    <span className="price-tag-value">
                      ${service.hourlyRate}
                    </span>
                    <span className="price-tag-unit">per hour</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="service-card-footer">
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  {service.deliveryDays && (
                    <span className="service-delivery">
                      Delivery: <span>{service.deliveryDays} days</span>
                    </span>
                  )}
                  {service.portfolioUrl && (
                    <a
                      href={service.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="portfolio-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      🔗 Portfolio
                    </a>
                  )}
                </div>

                {!isOwnService(service) && (
                  <button
                    className="btn-hire"
                    onClick={() =>
                      window.open(
                        `mailto:?subject=Hiring for ${service.title}&body=Hi, I found your service on BeatExchange and I would like to hire you for ${service.title}.`,
                        "_blank",
                      )
                    }
                  >
                    Hire
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
