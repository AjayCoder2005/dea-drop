import { createClient } from "@/utils/supabase/server";
import { getProducts } from "./actions";
import AddProductForm from "@/components/AddProductForm";
import ProductCard from "@/components/ProductCard";
import AuthButton from "@/components/AuthButton";
import { TrendingDown, Shield, Bell, Zap } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    emoji: "⚡",
    title: "Lightning Fast",
    description: "Firecrawl extracts prices in seconds, handling JavaScript and dynamic content across any store.",
  },
  {
    icon: Shield,
    emoji: "🛡️",
    title: "Always Reliable",
    description: "Built-in anti-bot bypass and rotating proxies keep tracking alive across all major e-commerce sites.",
  },
  {
    icon: Bell,
    emoji: "🔔",
    title: "Smart Alerts",
    description: "Get email notifications the moment a price drops or hits your custom target price.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const products = user ? await getProducts() : [];

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0f", color: "#f0f0f5" }}>

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "18px 32px",
        borderBottom: "1px solid #222230",
        position: "sticky", top: 0,
        background: "rgba(10,10,15,0.92)",
        backdropFilter: "blur(12px)",
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 600, letterSpacing: "-0.5px" }}>
          <div style={{
            width: 32, height: 32,
            background: "linear-gradient(135deg,#6c63ff,#ff6584)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
          }}>
            💰
          </div>
          DealDrop
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user && (
            <>
              {/* Realtime indicator */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 11, color: "#22c55e",
                background: "rgba(34,197,94,0.1)",
                padding: "4px 10px", borderRadius: 20, fontWeight: 500,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#22c55e", display: "inline-block",
                  animation: "liveBlip 1.4s ease-in-out infinite",
                }} />
                Realtime active
              </div>

              {/* User email */}
              <span style={{ fontSize: 13, color: "#555566" }}>
                {user.email}
              </span>
            </>
          )}
          <AuthButton user={user} />
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "72px 32px 56px", textAlign: "center", maxWidth: 800, margin: "0 auto" }}>

        {/* Tag */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 11, color: "#6c63ff",
          background: "rgba(108,99,255,0.1)",
          border: "1px solid rgba(108,99,255,0.2)",
          padding: "5px 14px", borderRadius: 20,
          marginBottom: 24, letterSpacing: ".5px",
          textTransform: "uppercase", fontWeight: 500,
        }}>
          ✦ Smart Price Tracking
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(36px,6vw,60px)",
          fontWeight: 300, lineHeight: 1.1,
          letterSpacing: "-2px", marginBottom: 16,
          color: "#f0f0f5",
        }}>
          Drop prices.{" "}
          <span style={{
            background: "linear-gradient(90deg,#6c63ff,#ff6584)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Not deals.
          </span>
        </h1>

        <p style={{
          fontSize: 16, color: "#888899",
          lineHeight: 1.7, maxWidth: 520,
          margin: "0 auto 40px",
        }}>
          Paste any product URL. We'll watch the price and notify you the moment
          it drops or hits your target — across every major store.
        </p>

        {/* URL Input */}
        <AddProductForm user={user} />

        {/* Stats row */}
        <div style={{
          display: "flex", justifyContent: "center",
          gap: 40, marginTop: 40, flexWrap: "wrap",
        }}>
          {[
            { num: products.length || "0", label: "Products tracked" },
            { num: "Daily",   label: "Price checks at 9AM UTC" },
            { num: "Instant", label: "Email alerts" },
          ].map(({ num, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 22, fontWeight: 600,
                background: "linear-gradient(90deg,#6c63ff,#ff6584)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {num}
              </div>
              <div style={{ fontSize: 12, color: "#555566", marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRODUCTS GRID ────────────────────────────────────────────────── */}
      {user && products.length > 0 && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 64px" }}>
          {/* Section label */}
          <div style={{
            fontSize: 11, color: "#555566",
            textTransform: "uppercase", letterSpacing: 1,
            marginBottom: 20,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            Your tracked products
            <span style={{ flex: 1, height: 1, background: "#222230", display: "block" }} />
            <span style={{ color: "#2a2a3a", fontWeight: 500 }}>
              {products.length} {products.length === 1 ? "product" : "products"}
            </span>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── EMPTY STATE ──────────────────────────────────────────────────── */}
      {user && products.length === 0 && (
        <section style={{ maxWidth: 480, margin: "0 auto", padding: "0 32px 64px", textAlign: "center" }}>
          <div style={{
            border: "1px dashed #222230",
            borderRadius: 16, padding: "60px 32px",
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛍️</div>
            <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: "#f0f0f5" }}>
              No products tracked yet
            </h3>
            <p style={{ fontSize: 14, color: "#555566" }}>
              Paste a product URL above to start tracking prices
            </p>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      {!user && (
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px 64px" }}>
          <div style={{
            fontSize: 11, color: "#555566",
            textTransform: "uppercase", letterSpacing: 1,
            marginBottom: 20,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            How it works
            <span style={{ flex: 1, height: 1, background: "#222230", display: "block" }} />
          </div>

          {/* Feature cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16, marginBottom: 48,
          }}>
            {FEATURES.map(({ emoji, title, description }) => (
              <div key={title} style={{
                background: "#111118",
                border: "1px solid #222230",
                borderRadius: 16, padding: 24,
              }}>
                <div style={{
                  width: 44, height: 44,
                  background: "rgba(108,99,255,0.1)",
                  border: "1px solid rgba(108,99,255,0.2)",
                  borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, marginBottom: 14,
                }}>
                  {emoji}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: "#f0f0f5" }}>{title}</h3>
                <p style={{ fontSize: 13, color: "#888899", lineHeight: 1.6, margin: 0 }}>{description}</p>
              </div>
            ))}
          </div>

          {/* Pipeline steps */}
          <div style={{
            fontSize: 11, color: "#555566",
            textTransform: "uppercase", letterSpacing: 1,
            marginBottom: 20,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            The pipeline
            <span style={{ flex: 1, height: 1, background: "#222230", display: "block" }} />
          </div>

          <div style={{ display: "flex", gap: 0, overflowX: "auto", paddingBottom: 8 }}>
            {[
              { n: "01", icon: "🔗", title: "Paste URL",        desc: "Any product from Amazon, Flipkart, Myntra, Zara & more" },
              { n: "02", icon: "🕷️", title: "Firecrawl",        desc: "AI extracts product name, price, currency & image" },
              { n: "03", icon: "💾", title: "Stored securely",  desc: "Saved in Supabase with per-user Row Level Security" },
              { n: "04", icon: "⏰", title: "Daily check",      desc: "pg_cron re-scrapes all products at 9 AM UTC" },
              { n: "05", icon: "📧", title: "Email alert",      desc: "Resend notifies you instantly on price drop or target hit" },
            ].map((step) => (
              <div key={step.n} style={{ flex: "1", minWidth: 160, padding: "0 8px 0 0" }}>
                <div style={{
                  background: "#111118",
                  border: "1px solid #222230",
                  borderRadius: 12, padding: "20px 16px",
                  textAlign: "center", height: "100%",
                }}>
                  <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#6c63ff", marginBottom: 8, opacity: .7 }}>{step.n}</div>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{step.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 4, color: "#f0f0f5" }}>{step.title}</div>
                  <div style={{ fontSize: 11, color: "#555566", lineHeight: 1.5 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid #222230",
        padding: "24px 32px",
        textAlign: "center",
        fontSize: 12, color: "#333340",
      }}>
        Built with Next.js · Firecrawl · Supabase · Resend
      </footer>

      {/* Global animations */}
      <style>{`
        @keyframes liveBlip {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.2; }
        }
      `}</style>
    </main>
  );
}