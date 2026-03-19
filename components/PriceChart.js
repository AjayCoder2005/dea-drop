"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Trash2, ExternalLink, BarChart2,
  Bell, BellOff, Check, TrendingDown,
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
    from { opacity: 0; transform: translateY(-8px) scale(0.8); }
    to   { opacity: 1; transform: translateY(0)    scale(1);   }
  }
  @keyframes pulseGlow {
    0%,100% { box-shadow: 0 0 0 0   rgba(34,197,94,0.5); }
    50%     { box-shadow: 0 0 0 10px rgba(34,197,94,0);   }
  }
  @keyframes liveBlip {
    0%,100% { opacity: 1;   }
    50%     { opacity: 0.1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .pc-price-drop { animation: priceDrop 0.8s ease-out forwards; }
  .pc-price-rise { animation: priceRise 0.7s ease-out forwards; }
  .pc-badge-in   { animation: badgeIn   0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .pc-pulse-glow { animation: pulseGlow 1.8s ease-in-out 3; }
  .pc-live-blip  { animation: liveBlip  1.4s ease-in-out infinite; }
  .pc-slide-up   { animation: slideUp   0.3s ease-out forwards; }
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
  const router  = useRouter();
  const supabase = createClient();

  useEffect(() => { injectStyles(); }, []);

  const [product, setProduct]                 = useState(initialProduct);
  const [priceFlash, setPriceFlash]           = useState(null);
  const [dropPct, setDropPct]                 = useState(null);
  const prevPrice                              = useRef(initialProduct.current_price);

  const [deleting, setDeleting]               = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [showChart, setShowChart]             = useState(false);
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [targetInput, setTargetInput]         = useState(initialProduct.target_price || "");
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [imgLoaded, setImgLoaded]             = useState(false);

  const currencyMap   = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const currency      = currencyMap[product.currency] || "₹";
  const animatedPrice = useCountUp(product.current_price ?? 0, 700);
  const isTargetMet   = product.target_price && product.current_price <= product.target_price;

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
              setPriceFlash("drop");
              setDropPct(pct);
              toast.success(`🔥 Price dropped ${pct}% on ${updated.name}!`, { duration: 5000 });
            } else {
              setPriceFlash("rise");
              setDropPct(null);
            }
            setTimeout(() => setPriceFlash(null), 2500);
            prevPrice.current = newPrice;
          }
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [product.id]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      setDeleting(true);
      setShowConfirm(false);
      await deleteProduct(product.id);
      toast.success("Product removed 🗑️");
      router.refresh();
    } catch {
      toast.error("Delete failed ❌");
      setDeleting(false);
    }
  };

  const handleSetTarget = async () => {
    try {
      setSaving(true);
      await setTargetPrice(product.id, parseFloat(targetInput));
      setSaved(true);
      toast.success("Alert set 🔔");
      setTimeout(() => {
        setSaved(false);
        setShowTargetInput(false);
        router.refresh();
      }, 600);
    } catch {
      toast.error("Failed to set alert ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTarget = async () => {
    await setTargetPrice(product.id, null);
    setTargetInput("");
    toast.success("Alert removed");
    router.refresh();
  };

  const priceColorStyle =
    priceFlash === "drop" ? { color: "#22c55e" } :
    priceFlash === "rise" ? { color: "#f43f5e" } :
    { color: "#6c63ff" };

  const priceAnimClass =
    priceFlash === "drop" ? "pc-price-drop" :
    priceFlash === "rise" ? "pc-price-rise"  : "";

  return (
    <div
      className={priceFlash === "drop" ? "pc-pulse-glow" : ""}
      style={{
        background: "#111118",
        border: `1px solid ${priceFlash === "drop" || isTargetMet ? "rgba(34,197,94,0.4)" : "#222230"}`,
        borderRadius: 16, overflow: "hidden",
        display: "flex", flexDirection: "column",
        transition: "all 0.3s",
        opacity: deleting ? 0.4 : 1,
        boxShadow: priceFlash === "drop"
          ? "0 0 0 2px rgba(34,197,94,0.2)"
          : isTargetMet ? "0 0 0 1px rgba(34,197,94,0.15)" : "none",
      }}
    >
      {/* IMAGE */}
      <div style={{
        position: "relative", width: "100%", height: 160,
        background: "linear-gradient(135deg,#1a1a2e,#16213e)", overflow: "hidden",
      }}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            style={{ objectFit: "contain", padding: 12, opacity: imgLoaded ? 1 : 0, transition: "opacity 0.5s" }}
            onLoad={() => setImgLoaded(true)}
            unoptimized
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🛍️</div>
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 50%,#111118)" }} />

        {/* LIVE badge */}
        <div style={{ position: "absolute", top: 10, right: 10, zIndex: 10, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 20 }}>
          <span className="pc-live-blip" style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
          LIVE
        </div>

        {/* Target reached */}
        {isTargetMet && (
          <div className="pc-badge-in" style={{ position: "absolute", top: 10, left: 10, zIndex: 10, background: "#22c55e", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
            🎯 Target Reached!
          </div>
        )}

        {/* Drop badge */}
        {priceFlash === "drop" && dropPct && (
          <div className="pc-badge-in" style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, display: "flex", alignItems: "center", gap: 4, background: "#22c55e", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
            <TrendingDown style={{ width: 12, height: 12 }} />-{dropPct}%
          </div>
        )}

        {/* Rise badge */}
        {priceFlash === "rise" && (
          <div className="pc-badge-in" style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, background: "#f43f5e", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>↑ Price up</div>
        )}

        {/* Delete button */}
        <button
          onClick={() => setShowConfirm(true)} disabled={deleting}
          style={{ position: "absolute", top: 10, left: isTargetMet ? "auto" : 10, right: isTargetMet ? 44 : "auto", zIndex: 10, background: "rgba(0,0,0,0.5)", color: "#888899", border: "none", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>

      {/* BODY */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>

        {/* Source + name */}
        <div>
          <div style={{ fontSize: 10, color: "#555566", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 5 }}>
            {(() => { try { return new URL(product.url).hostname.replace("www.", ""); } catch { return ""; } })()}
          </div>
          <a href={product.url} target="_blank" rel="noreferrer" style={{ color: "#f0f0f5", textDecoration: "none" }}>
            <p style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {product.name}
            </p>
          </a>
        </div>

        {/* Price */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span className={priceAnimClass} style={{ fontSize: 22, fontWeight: 700, fontFamily: "'DM Mono', monospace", letterSpacing: -1, display: "inline-block", ...priceColorStyle }}>
            {currency}{animatedPrice.toLocaleString("en-IN")}
          </span>
          {priceFlash === "drop" ? (
            <span className="pc-slide-up" style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.12)", padding: "2px 8px", borderRadius: 20 }}>
              <TrendingDown style={{ width: 11, height: 11 }} /> Dropped!
            </span>
          ) : priceFlash === "rise" ? (
            <span className="pc-slide-up" style={{ fontSize: 11, fontWeight: 600, color: "#f43f5e", background: "rgba(244,63,94,0.12)", padding: "2px 8px", borderRadius: 20 }}>↑ Rose</span>
          ) : (
            <span style={{ fontSize: 11, color: "#555566" }}>↘ Tracking</span>
          )}
        </div>

        {/* Target badge */}
        {product.target_price && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "8px 12px", borderRadius: 8, border: `1px solid ${isTargetMet ? "rgba(34,197,94,0.3)" : "rgba(245,158,11,0.3)"}`, background: isTargetMet ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)", color: isTargetMet ? "#22c55e" : "#f59e0b" }}>
            <span>🎯 Alert: {currency}{parseFloat(product.target_price).toLocaleString("en-IN")}</span>
            <button onClick={handleRemoveTarget} style={{ background: "none", border: "none", color: "#555566", cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        )}

        {/* Target input */}
        {showTargetInput && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="number"
              placeholder={`Target price (${currency})`}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              style={{ flex: 1, background: "#18181f", border: "1px solid #2a2a3a", borderRadius: 8, padding: "7px 12px", color: "#f0f0f5", fontSize: 13, outline: "none", fontFamily: "'DM Mono', monospace" }}
            />
            <button
              onClick={handleSetTarget}
              disabled={saving || !targetInput}
              style={{ background: saving ? "#2a2a3a" : "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 4 }}
            >
              {saved ? <Check style={{ width: 14, height: 14 }} /> : saving ? "…" : "Set"}
            </button>
          </div>
        )}

        {/* Confirm delete */}
        {showConfirm && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
            <span style={{ fontSize: 12, color: "#f43f5e", flex: 1 }}>Remove this product?</span>
            <button onClick={handleDelete} style={{ background: "#f43f5e", color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}>Yes</button>
            <button onClick={() => setShowConfirm(false)} style={{ background: "#18181f", color: "#888899", border: "1px solid #222230", borderRadius: 6, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}>No</button>
          </div>
        )}

        {/* Action buttons */}
        {!showConfirm && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: "auto" }}>
            <a href={product.url} target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "transparent", border: "1px solid #2a2a3a", color: "#888899", borderRadius: 8, padding: "7px 0", fontSize: 12, textDecoration: "none", transition: "all .2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#6c63ff"; e.currentTarget.style.color = "#6c63ff"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3a"; e.currentTarget.style.color = "#888899"; }}
            >
              <ExternalLink style={{ width: 12, height: 12 }} /> View
            </a>
            <button
              onClick={() => setShowTargetInput(!showTargetInput)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "transparent", border: `1px solid ${product.target_price ? "rgba(245,158,11,0.4)" : "#2a2a3a"}`, color: product.target_price ? "#f59e0b" : "#888899", borderRadius: 8, padding: "7px 0", fontSize: 12, cursor: "pointer", transition: "all .2s" }}
            >
              {product.target_price
                ? <><BellOff style={{ width: 12, height: 12 }} /> Alert</>
                : <><Bell    style={{ width: 12, height: 12 }} /> Alert</>}
            </button>
          </div>
        )}

        {/* Chart toggle */}
        <button
          onClick={() => setShowChart(!showChart)}
          style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, fontSize: 11, color: showChart ? "#6c63ff" : "#555566", background: "none", border: "none", borderTop: "1px solid #222230", paddingTop: 10, cursor: "pointer", transition: "color .2s", fontFamily: "'Sora', sans-serif" }}
        >
          <BarChart2 style={{ width: 12, height: 12 }} />
          {showChart ? "Hide History ▴" : "Price History ▾"}
        </button>
      </div>

      {/* Chart */}
      {showChart && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #222230" }}>
          <PriceChart productId={product.id} currency={product.currency} />
        </div>
      )}
    </div>
  );
};

export default ProductCard;