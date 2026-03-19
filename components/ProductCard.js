"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Trash2, ExternalLink, BarChart2,
  Bell, BellOff, Check, TrendingDown,
  TrendingUp, Minus, Target, Eye,
} from "lucide-react";
import { deleteProduct, setTargetPrice } from "@/app/actions";
import PriceChart from "./PriceChart";
import { toast } from "sonner";

// ── inject keyframes once ─────────────────────────────────────────────────────
const STYLES = `
  @keyframes priceDrop {
    0%   { transform: scale(1);    background: transparent; }
    20%  { transform: scale(1.18); background: rgba(34,197,94,0.18); border-radius: 8px; }
    60%  { transform: scale(1.08); background: rgba(34,197,94,0.10); }
    100% { transform: scale(1);    background: transparent; }
  }
  @keyframes priceRise {
    0%   { transform: scale(1);   background: transparent; }
    20%  { transform: scale(1.1); background: rgba(244,63,94,0.14); border-radius: 8px; }
    100% { transform: scale(1);   background: transparent; }
  }
  @keyframes badgeIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.85); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }
  @keyframes pulseGlow {
    0%,100% { box-shadow: 0 0 0 0   rgba(34,197,94,0.4); }
    50%     { box-shadow: 0 0 0 8px rgba(34,197,94,0);   }
  }
  @keyframes liveBlip {
    0%,100% { opacity: 1;   transform: scale(1);    }
    50%     { opacity: 0.2; transform: scale(0.85); }
  }
  @keyframes slideUpSmall {
    from { opacity: 0; transform: translateY(5px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes chartReveal {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes imgShimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  .pc-price-drop { animation: priceDrop    0.8s ease-out forwards; display: inline-block; }
  .pc-price-rise { animation: priceRise    0.7s ease-out forwards; display: inline-block; }
  .pc-badge-in   { animation: badgeIn      0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .pc-pulse-glow { animation: pulseGlow    1.8s ease-in-out 3; }
  .pc-live-blip  { animation: liveBlip     1.4s ease-in-out infinite; }
  .pc-slide-up   { animation: slideUpSmall 0.3s ease-out forwards; }
  .pc-chart-open { animation: chartReveal  0.3s ease-out forwards; }
  .pc-img-shimmer {
    background: linear-gradient(90deg, #18181f 25%, #222230 50%, #18181f 75%);
    background-size: 800px 100%;
    animation: imgShimmer 1.4s ease-in-out infinite;
  }
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("product-card-styles")) return;
  const tag = document.createElement("style");
  tag.id = "product-card-styles";
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

// ── animated price counter ────────────────────────────────────────────────────
function useCountUp(value, duration = 700) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const startTime = performance.now();
    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (value - start) * ease));
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = value;
    };
    requestAnimationFrame(tick);
  }, [value, duration]);
  return display;
}

// ─────────────────────────────────────────────────────────────────────────────
const ProductCard = ({ product: initialProduct }) => {
  const router   = useRouter();
  const supabase = createClient();

  useEffect(() => { injectStyles(); }, []);

  const [product, setProduct]                 = useState(initialProduct);
  const [priceFlash, setPriceFlash]           = useState(null);
  const [dropPct, setDropPct]                 = useState(null);
  const prevPrice                              = useRef(initialProduct.current_price);

  const [deleting, setDeleting]               = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [showChart, setShowChart]             = useState(false);
  const [chartKey, setChartKey]               = useState(0);
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [targetInput, setTargetInput]         = useState(initialProduct.target_price || "");
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [imgLoaded, setImgLoaded]             = useState(false);
  const [imgError, setImgError]               = useState(false);

  const currencyMap   = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const currency      = currencyMap[product.currency] || "₹";
  const animatedPrice = useCountUp(product.current_price ?? 0, 700);
  const isTargetMet   = product.target_price && product.current_price <= product.target_price;

  const handleToggleChart = () => {
    if (!showChart) { setChartKey(k => k + 1); setShowChart(true); }
    else setShowChart(false);
  };

  // ── Supabase Realtime ─────────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel(`product-${product.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products", filter: `id=eq.${product.id}` },
        (payload) => {
          const updated  = payload.new;
          const oldPrice = prevPrice.current;
          const newPrice = updated.current_price;
          setProduct(updated);
          if (newPrice !== oldPrice) {
            const pct = (((oldPrice - newPrice) / oldPrice) * 100).toFixed(1);
            if (newPrice < oldPrice) {
              setPriceFlash("drop"); setDropPct(pct);
              toast.success(`🔥 Price dropped ${pct}% on ${updated.name}!`, { duration: 5000 });
            } else {
              setPriceFlash("rise"); setDropPct(null);
            }
            setTimeout(() => setPriceFlash(null), 2500);
            prevPrice.current = newPrice;
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [product.id]);

  const handleDelete = async () => {
    try {
      setDeleting(true); setShowConfirm(false);
      await deleteProduct(product.id);
      toast.success("Product removed");
      router.refresh();
    } catch {
      toast.error("Delete failed"); setDeleting(false);
    }
  };

  const handleSetTarget = async () => {
    try {
      setSaving(true);
      await setTargetPrice(product.id, parseFloat(targetInput));
      setSaved(true);
      toast.success("Alert set 🔔");
      setTimeout(() => { setSaved(false); setShowTargetInput(false); router.refresh(); }, 600);
    } catch {
      toast.error("Failed to set alert");
    } finally { setSaving(false); }
  };

  const handleRemoveTarget = async () => {
    await setTargetPrice(product.id, null);
    setTargetInput("");
    toast.success("Alert removed");
    router.refresh();
  };

  const priceColor =
    priceFlash === "drop" ? "#22c55e" :
    priceFlash === "rise" ? "#f43f5e" : "#a78bfa";

  return (
    <div
      className={priceFlash === "drop" ? "pc-pulse-glow" : ""}
      style={{
        background: "#0e0e14",
        border: `1px solid ${priceFlash === "drop" || isTargetMet ? "rgba(34,197,94,0.35)" : "#1e1e2a"}`,
        borderRadius: 18, overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "border-color 0.3s, box-shadow 0.3s",
        opacity: deleting ? 0.4 : 1,
      }}
    >
      {/* ── IMAGE ────────────────────────────────────────────────────────── */}
      <div style={{
        position: "relative", width: "100%",
        aspectRatio: "16/9",
        background: "#13131a",
        overflow: "hidden", flexShrink: 0,
      }}>
        {/* Shimmer while loading */}
        {!imgLoaded && !imgError && (
          <div className="pc-img-shimmer" style={{ position: "absolute", inset: 0, zIndex: 1 }} />
        )}

        {/* Emoji fallback */}
        {(!product.image_url || imgError) && (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 44, filter: "grayscale(0.2)" }}>🛍️</span>
            <span style={{ fontSize: 10, color: "#333340", letterSpacing: 1 }}>
              {(() => { try { return new URL(product.url).hostname.replace("www.", ""); } catch { return ""; } })()}
            </span>
          </div>
        )}

        {/* Actual image — dark background so white-bg images blend */}
        {product.image_url && !imgError && (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            style={{
              objectFit: "contain",
              padding: "14px",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.4s ease",
              // mix-blend-mode makes white product images transparent on dark bg
              mixBlendMode: "luminosity",
              filter: "brightness(0.92) contrast(1.05)",
            }}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            unoptimized
          />
        )}

        {/* Dark gradient overlay at bottom */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "50%",
          background: "linear-gradient(to bottom, transparent, #0e0e14)",
          zIndex: 2,
        }} />

        {/* ── LIVE badge ── */}
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 5,
          display: "flex", alignItems: "center", gap: 5,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(34,197,94,0.2)",
          color: "#22c55e", fontSize: 9, fontWeight: 700,
          padding: "4px 8px", borderRadius: 20,
          letterSpacing: "0.5px",
        }}>
          <span className="pc-live-blip" style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0 }} />
          LIVE
        </div>

        {/* ── Target reached badge ── */}
        {isTargetMet && (
          <div className="pc-badge-in" style={{
            position: "absolute", top: 10, left: 10, zIndex: 5,
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(34,197,94,0.15)",
            border: "1px solid rgba(34,197,94,0.4)",
            color: "#22c55e", fontSize: 10, fontWeight: 700,
            padding: "4px 10px", borderRadius: 20,
            backdropFilter: "blur(8px)",
          }}>
            <Target style={{ width: 10, height: 10 }} />
            Target reached!
          </div>
        )}

        {/* ── Price drop flash badge ── */}
        {priceFlash === "drop" && dropPct && (
          <div className="pc-badge-in" style={{
            position: "absolute", bottom: 14, left: 12, zIndex: 5,
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(34,197,94,0.9)",
            color: "#fff", fontSize: 11, fontWeight: 700,
            padding: "4px 10px", borderRadius: 20,
          }}>
            <TrendingDown style={{ width: 11, height: 11 }} />
            -{dropPct}% drop
          </div>
        )}

        {/* ── Price rise flash badge ── */}
        {priceFlash === "rise" && (
          <div className="pc-badge-in" style={{
            position: "absolute", bottom: 14, left: 12, zIndex: 5,
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(244,63,94,0.9)",
            color: "#fff", fontSize: 11, fontWeight: 700,
            padding: "4px 10px", borderRadius: 20,
          }}>
            <TrendingUp style={{ width: 11, height: 11 }} />
            Price up
          </div>
        )}

        {/* ── Delete button ── */}
        <button
          onClick={() => setShowConfirm(true)} disabled={deleting}
          style={{
            position: "absolute",
            top: 10,
            left: isTargetMet ? "auto" : 10,
            right: isTargetMet ? 10 : "auto",
            zIndex: 5,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
            color: "#555566", border: "1px solid rgba(255,255,255,0.06)",
            width: 28, height: 28, borderRadius: "50%",
            cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            transition: "all .2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(244,63,94,0.7)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,0,0,0.6)"; e.currentTarget.style.color = "#555566"; }}
        >
          <Trash2 style={{ width: 11, height: 11 }} />
        </button>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>

        {/* Source */}
        <div style={{ fontSize: 10, color: "#333340", textTransform: "uppercase", letterSpacing: "0.8px" }}>
          {(() => { try { return new URL(product.url).hostname.replace("www.", ""); } catch { return ""; } })()}
        </div>

        {/* Name */}
        <a href={product.url} target="_blank" rel="noreferrer" style={{ color: "#d0d0e0", textDecoration: "none" }}>
          <p style={{
            fontSize: 13, fontWeight: 500, lineHeight: 1.45, margin: 0,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {product.name}
          </p>
        </a>

        {/* ── Price row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            className={priceFlash === "drop" ? "pc-price-drop" : priceFlash === "rise" ? "pc-price-rise" : ""}
            style={{ fontSize: 24, fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: -1, display: "inline-block", color: priceColor, transition: "color .3s" }}
          >
            {currency}{animatedPrice.toLocaleString("en-IN")}
          </span>

          {/* Status pill */}
          {priceFlash === "drop" ? (
            <span className="pc-slide-up" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", padding: "2px 8px", borderRadius: 20 }}>
              <TrendingDown style={{ width: 10, height: 10 }} /> Dropped!
            </span>
          ) : priceFlash === "rise" ? (
            <span className="pc-slide-up" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "#f43f5e", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", padding: "2px 8px", borderRadius: 20 }}>
              <TrendingUp style={{ width: 10, height: 10 }} /> Rose
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "#333340", letterSpacing: "0.3px" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#333340", display: "inline-block" }} />
              Tracking
            </span>
          )}
        </div>

        {/* ── Target badge ── */}
        {product.target_price && (
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            fontSize: 12, padding: "8px 12px", borderRadius: 10,
            border: `1px solid ${isTargetMet ? "rgba(34,197,94,0.25)" : "rgba(167,139,250,0.2)"}`,
            background: isTargetMet ? "rgba(34,197,94,0.06)" : "rgba(167,139,250,0.06)",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: isTargetMet ? "#22c55e" : "#a78bfa" }}>
              <Target style={{ width: 11, height: 11 }} />
              Alert: {currency}{parseFloat(product.target_price).toLocaleString("en-IN")}
              {isTargetMet && <span style={{ fontSize: 10, background: "rgba(34,197,94,0.15)", padding: "1px 6px", borderRadius: 10, color: "#22c55e" }}>✓ Met</span>}
            </span>
            <button onClick={handleRemoveTarget} style={{ background: "none", border: "none", color: "#333340", cursor: "pointer", fontSize: 13, lineHeight: 1, padding: "0 2px", transition: "color .2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#f43f5e"}
              onMouseLeave={e => e.currentTarget.style.color = "#333340"}
            >✕</button>
          </div>
        )}

        {/* ── Target input ── */}
        {showTargetInput && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              placeholder={`Target price (${currency})`}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              autoFocus
              style={{ flex: 1, background: "#13131a", border: "1px solid #1e1e2a", borderRadius: 8, padding: "7px 12px", color: "#f0f0f5", fontSize: 13, outline: "none", fontFamily: "'DM Mono', monospace", transition: "border-color .2s" }}
              onFocus={e => e.target.style.borderColor = "#6c63ff"}
              onBlur={e => e.target.style.borderColor = "#1e1e2a"}
            />
            <button
              onClick={handleSetTarget}
              disabled={saving || !targetInput}
              style={{ background: saved ? "#22c55e" : saving ? "#1e1e2a" : "#6c63ff", color: "#fff", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4, transition: "background .2s", flexShrink: 0 }}
            >
              {saved ? <Check style={{ width: 14, height: 14 }} /> : saving ? "…" : "Set"}
            </button>
          </div>
        )}

        {/* ── Confirm delete ── */}
        {showConfirm && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, background: "rgba(244,63,94,0.07)", border: "1px solid rgba(244,63,94,0.2)" }}>
            <span style={{ fontSize: 12, color: "#f43f5e", flex: 1 }}>Remove this product?</span>
            <button onClick={handleDelete} style={{ background: "#f43f5e", color: "#fff", border: "none", borderRadius: 6, padding: "4px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Yes</button>
            <button onClick={() => setShowConfirm(false)} style={{ background: "#18181f", color: "#888899", border: "1px solid #222230", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}>No</button>
          </div>
        )}

        {/* ── Action buttons ── */}
        {!showConfirm && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: "auto" }}>
            <a
              href={product.url} target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: "1px solid #1e1e2a", color: "#555566", borderRadius: 10, padding: "8px 0", fontSize: 12, textDecoration: "none", transition: "all .2s", fontFamily: "'Sora', sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#6c63ff"; e.currentTarget.style.color = "#a78bfa"; e.currentTarget.style.background = "rgba(108,99,255,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e2a"; e.currentTarget.style.color = "#555566"; e.currentTarget.style.background = "transparent"; }}
            >
              <Eye style={{ width: 12, height: 12 }} /> View
            </a>
            <button
              onClick={() => setShowTargetInput(!showTargetInput)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: showTargetInput ? "rgba(167,139,250,0.08)" : "transparent", border: `1px solid ${product.target_price ? "rgba(167,139,250,0.3)" : "#1e1e2a"}`, color: product.target_price ? "#a78bfa" : "#555566", borderRadius: 10, padding: "8px 0", fontSize: 12, cursor: "pointer", transition: "all .2s", fontFamily: "'Sora', sans-serif" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#a78bfa"; e.currentTarget.style.color = "#a78bfa"; e.currentTarget.style.background = "rgba(167,139,250,0.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = product.target_price ? "rgba(167,139,250,0.3)" : "#1e1e2a"; e.currentTarget.style.color = product.target_price ? "#a78bfa" : "#555566"; e.currentTarget.style.background = showTargetInput ? "rgba(167,139,250,0.08)" : "transparent"; }}
            >
              {product.target_price
                ? <><BellOff style={{ width: 12, height: 12 }} /> Alert</>
                : <><Bell    style={{ width: 12, height: 12 }} /> Alert</>}
            </button>
          </div>
        )}

        {/* ── Chart toggle ── */}
        <button
          onClick={handleToggleChart}
          style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, fontSize: 11, color: showChart ? "#6c63ff" : "#333340", background: "none", border: "none", borderTop: "1px solid #1a1a24", paddingTop: 10, cursor: "pointer", transition: "color .2s", fontFamily: "'Sora', sans-serif" }}
          onMouseEnter={e => e.currentTarget.style.color = "#6c63ff"}
          onMouseLeave={e => e.currentTarget.style.color = showChart ? "#6c63ff" : "#333340"}
        >
          <BarChart2 style={{ width: 11, height: 11 }} />
          {showChart ? "Hide History ▴" : "Price History ▾"}
        </button>
      </div>

      {/* ── Chart ── */}
      {showChart && (
        <div className="pc-chart-open" style={{ padding: "0 16px 16px", borderTop: "1px solid #1a1a24" }}>
          <PriceChart key={chartKey} productId={product.id} currency={product.currency} />
        </div>
      )}
    </div>
  );
};

export default ProductCard;