import { createClient } from "@/utils/supabase/server";
import { getProducts } from "./actions";
import AddProductForm from "@/components/AddProductForm";
import ProductCard from "@/components/ProductCard";
import AuthButton from "@/components/AuthButton";

const FEATURES = [
  { emoji: "⚡", title: "Lightning Fast",   description: "Firecrawl extracts prices in seconds, handling JavaScript and dynamic content across any store." },
  { emoji: "🛡️", title: "Always Reliable", description: "Built-in anti-bot bypass and rotating proxies keep tracking alive across all major e-commerce sites." },
  { emoji: "🔔", title: "Smart Alerts",     description: "Get email notifications the moment a price drops or hits your custom target price." },
];

const STEPS = [
  { n: "01", icon: "🔗", title: "Paste URL",       desc: "Any product from Amazon, Flipkart, Myntra, Zara & more" },
  { n: "02", icon: "🕷️", title: "Firecrawl",       desc: "AI extracts product name, price, currency & image" },
  { n: "03", icon: "💾", title: "Stored securely", desc: "Saved in Supabase with per-user Row Level Security" },
  { n: "04", icon: "⏰", title: "Daily check",     desc: "pg_cron re-scrapes all products at 9 AM UTC" },
  { n: "05", icon: "📧", title: "Email alert",     desc: "Resend notifies you instantly on price drop or target hit" },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ✅ Single fetch — never called twice
  const products = user ? await getProducts() : [];

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0f5" }}>

      {/* ── NAV ── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px",
        borderBottom: "1px solid #1a1a24",
        position: "sticky", top: 0,
        background: "rgba(10,10,15,0.94)",
        backdropFilter: "blur(14px)",
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 600, letterSpacing: "-0.5px" }}>
          <div style={{ width: 32, height: 32, background: "linear-gradient(135deg,#6c63ff,#ff6584)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
            💰
          </div>
          DealDrop
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#22c55e", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", padding: "4px 10px", borderRadius: 20, fontWeight: 500 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "liveBlip 1.4s ease-in-out infinite" }} />
                Realtime active
              </div>
              <span style={{ fontSize: 12, color: "#444455" }}>{user.email}</span>
            </>
          )}
          <AuthButton user={user} />
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ padding: "72px 32px 56px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6c63ff", background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.18)", padding: "5px 14px", borderRadius: 20, marginBottom: 24, letterSpacing: ".5px", textTransform: "uppercase", fontWeight: 500 }}>
          ✦ Smart Price Tracking
        </div>

        <h1 style={{ fontSize: "clamp(36px,6vw,60px)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-2px", marginBottom: 16, color: "#f0f0f5" }}>
          Drop prices.{" "}
          <span style={{ background: "linear-gradient(90deg,#6c63ff,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Not deals.
          </span>
        </h1>

        <p style={{ fontSize: 15, color: "#666680", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
          Paste any product URL. We'll watch the price and notify you the moment it drops or hits your target — across every major store.
        </p>

        <AddProductForm user={user} />

        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 40, flexWrap: "wrap" }}>
          {[
            { num: products.length || "0", label: "Products tracked" },
            { num: "Daily",   label: "Price checks at 9AM UTC" },
            { num: "Instant", label: "Email alerts" },
          ].map(({ num, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 600, background: "linear-gradient(90deg,#6c63ff,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{num}</div>
              <div style={{ fontSize: 11, color: "#333340", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS GRID ── only when has products ── */}
      {user && products.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 64px" }}>
          <div style={{ fontSize: 10, color: "#333340", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            Your tracked products
            <span style={{ flex: 1, height: 1, background: "#1a1a24", display: "block" }} />
            <span style={{ color: "#2a2a3a", fontWeight: 500 }}>
              {products.length} {products.length === 1 ? "product" : "products"}
            </span>
          </div>

          {/* ✅ Each product renders ONCE via unique key */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── EMPTY STATE ── only when logged in but no products ── */}
      {user && products.length === 0 && (
        <section style={{ maxWidth: 480, margin: "0 auto", padding: "0 32px 64px", textAlign: "center" }}>
          <div style={{ border: "1px dashed #1a1a24", borderRadius: 16, padding: "60px 32px" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
            <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: "#f0f0f5" }}>No products tracked yet</h3>
            <p style={{ fontSize: 14, color: "#444455" }}>Paste a product URL above to start tracking prices</p>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── only for guests ── */}
      {!user && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 64px" }}>

          <div style={{ fontSize: 11, color: "#333340", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            How it works
            <span style={{ flex: 1, height: 1, background: "#1a1a24", display: "block" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 48 }}>
            {FEATURES.map(({ emoji, title, description }) => (
              <div key={title} style={{ background: "#0e0e14", border: "1px solid #1a1a24", borderRadius: 16, padding: 24 }}>
                <div style={{ width: 44, height: 44, background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 14 }}>
                  {emoji}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: "#d0d0e0" }}>{title}</h3>
                <p style={{ fontSize: 12, color: "#555566", lineHeight: 1.6, margin: 0 }}>{description}</p>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: "#333340", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            The pipeline
            <span style={{ flex: 1, height: 1, background: "#1a1a24", display: "block" }} />
          </div>

          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
            {STEPS.map((step, i) => (
              <div key={step.n} style={{ flex: "1", minWidth: 155 }}>
                <div style={{ background: "#0e0e14", border: "1px solid #1a1a24", borderRadius: 12, padding: "18px 14px", textAlign: "center", height: "100%", position: "relative" }}>
                  <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#6c63ff", marginBottom: 8, opacity: .6 }}>{step.n}</div>
                  <div style={{ fontSize: 20, marginBottom: 8 }}>{step.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, marginBottom: 4, color: "#d0d0e0" }}>{step.title}</div>
                  <div style={{ fontSize: 10, color: "#333340", lineHeight: 1.5 }}>{step.desc}</div>
                  {i < STEPS.length - 1 && (
                    <div style={{ position: "absolute", right: -12, top: "50%", transform: "translateY(-50%)", color: "#1a1a24", fontSize: 18 }}>›</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer style={{ borderTop: "1px solid #1a1a24", padding: "22px 32px", textAlign: "center", fontSize: 11, color: "#222230" }}>
        Built with Next.js · Firecrawl · Supabase · Resend
      </footer>

      <style>{`
        @keyframes liveBlip {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.2; transform: scale(0.85); }
        }
      `}</style>
    </main>
  );
}