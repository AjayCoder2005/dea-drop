import { createClient } from "@/utils/supabase/server";
import { getProducts } from "./actions";
import AddProductForm from "@/components/AddProductForm";
import ProductCard from "@/components/ProductCard";
import AuthButton from "@/components/AuthButton";

const FEATURES = [
  { emoji: "⚡", title: "Lightning Fast",   description: "Firecrawl extracts prices in seconds, handling JavaScript and dynamic content." },
  { emoji: "🛡️", title: "Always Reliable", description: "Built-in anti-bot bypass and rotating proxies keep tracking alive." },
  { emoji: "🔔", title: "Smart Alerts",     description: "Get email notifications the moment a price drops or hits your target." },
];

const STEPS = [
  { n: "01", icon: "🔗", title: "Paste URL",       desc: "Amazon, Flipkart, Myntra, Zara & more" },
  { n: "02", icon: "🕷️", title: "Firecrawl",       desc: "AI extracts name, price & image" },
  { n: "03", icon: "💾", title: "Stored",           desc: "Supabase with Row Level Security" },
  { n: "04", icon: "⏰", title: "Daily check",     desc: "pg_cron at 9 AM UTC" },
  { n: "05", icon: "📧", title: "Email alert",     desc: "Instant on drop or target hit" },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const products = user ? await getProducts() : [];

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0f5" }}>

      {/* ── NAV — responsive ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px",
        borderBottom: "1px solid #1a1a24",
        position: "sticky", top: 0,
        background: "rgba(10,10,15,0.96)",
        backdropFilter: "blur(14px)",
        zIndex: 100,
        gap: 8,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 16, fontWeight: 600, letterSpacing: "-0.5px", flexShrink: 0 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg,#6c63ff,#ff6584)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            💰
          </div>
          DealDrop
        </div>

        {/* Right — shrinks on mobile */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", padding: "3px 8px", borderRadius: 20, fontWeight: 500, flexShrink: 0 }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "liveBlip 1.4s ease-in-out infinite" }} />
              Live
            </div>
          )}
          {/* Hide email on very small screens */}
          {user && (
            <span style={{ fontSize: 11, color: "#333340", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px", display: "none" }}
              className="desktop-email">
              {user.email}
            </span>
          )}
          <AuthButton user={user} />
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ padding: "48px 20px 40px", textAlign: "center", maxWidth: 780, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#6c63ff", background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.18)", padding: "4px 12px", borderRadius: 20, marginBottom: 20, letterSpacing: ".5px", textTransform: "uppercase", fontWeight: 500 }}>
          ✦ Smart Price Tracking
        </div>

        <h1 style={{ fontSize: "clamp(32px,7vw,60px)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-2px", marginBottom: 14, color: "#f0f0f5" }}>
          Drop prices.{" "}
          <span style={{ background: "linear-gradient(90deg,#6c63ff,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Not deals.
          </span>
        </h1>

        <p style={{ fontSize: 14, color: "#666680", lineHeight: 1.7, maxWidth: 480, margin: "0 auto 32px" }}>
          Paste any product URL. We'll watch the price and notify you the moment it drops or hits your target.
        </p>

        <AddProductForm user={user} />

        {/* Stats — always 3 in a row, compact on mobile */}
        <div style={{ display: "flex", justifyContent: "center", gap: 0, marginTop: 36, width: "100%" }}>
          {[
            { num: products.length || "0", label: "Tracked" },
            { num: "Daily", label: "Price checks" },
            { num: "Instant", label: "Alerts" },
          ].map(({ num, label }, i) => (
            <div key={label} style={{
              flex: 1, textAlign: "center",
              borderRight: i < 2 ? "1px solid #1a1a24" : "none",
              padding: "0 8px",
            }}>
              <div style={{ fontSize: "clamp(16px,4vw,22px)", fontWeight: 600, background: "linear-gradient(90deg,#6c63ff,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{num}</div>
              <div style={{ fontSize: 10, color: "#333340", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS GRID ── */}
      {user && products.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 64px" }}>
          <div style={{ fontSize: 10, color: "#2a2a3a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            Your tracked products
            <span style={{ flex: 1, height: 1, background: "#1a1a24", display: "block" }} />
            <span style={{ color: "#2a2a3a" }}>{products.length}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── EMPTY STATE ── */}
      {user && products.length === 0 && (
        <section style={{ maxWidth: 400, margin: "0 auto", padding: "0 16px 64px", textAlign: "center" }}>
          <div style={{ border: "1px dashed #1a1a24", borderRadius: 16, padding: "48px 24px" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🛍️</div>
            <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: "#f0f0f5" }}>No products yet</h3>
            <p style={{ fontSize: 13, color: "#333340" }}>Paste a product URL above to start tracking</p>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS (guests) ── */}
      {!user && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 16px 64px" }}>
          <div style={{ fontSize: 10, color: "#2a2a3a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            How it works <span style={{ flex: 1, height: 1, background: "#1a1a24" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginBottom: 40 }}>
            {FEATURES.map(({ emoji, title, description }) => (
              <div key={title} style={{ background: "#0e0e14", border: "1px solid #1a1a24", borderRadius: 14, padding: 20 }}>
                <div style={{ width: 40, height: 40, background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.14)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>{emoji}</div>
                <h3 style={{ fontSize: 13, fontWeight: 500, marginBottom: 5, color: "#d0d0e0" }}>{title}</h3>
                <p style={{ fontSize: 12, color: "#444455", lineHeight: 1.6, margin: 0 }}>{description}</p>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#2a2a3a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            Pipeline <span style={{ flex: 1, height: 1, background: "#1a1a24" }} />
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
            {STEPS.map((step) => (
              <div key={step.n} style={{ flex: "0 0 140px" }}>
                <div style={{ background: "#0e0e14", border: "1px solid #1a1a24", borderRadius: 12, padding: "16px 12px", textAlign: "center" }}>
                  <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "#6c63ff", marginBottom: 6, opacity: .6 }}>{step.n}</div>
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{step.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 3, color: "#d0d0e0" }}>{step.title}</div>
                  <div style={{ fontSize: 9, color: "#2a2a3a", lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer style={{ borderTop: "1px solid #1a1a24", padding: "18px 16px", textAlign: "center", fontSize: 10, color: "#1e1e2a" }}>
        Built with Next.js · Firecrawl · Supabase · Resend
      </footer>

      <style>{`
        @keyframes liveBlip {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.2; transform:scale(0.8); }
        }
        @media (min-width: 640px) {
          .desktop-email { display: block !important; }
        }
      `}</style>
    </main>
  );
}