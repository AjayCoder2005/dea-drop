"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Trash2, ExternalLink, BarChart2,
  Bell, BellOff, Check, TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteProduct, setTargetPrice } from "@/app/actions";
import PriceChart from "./PriceChart";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

// ── inject keyframes into <head> once, never inside JSX ──────────────────────
const STYLES = `
  @keyframes priceDrop {
    0%   { transform: scale(1);    background: transparent; }
    20%  { transform: scale(1.18); background: rgba(16,185,129,0.18); border-radius: 8px; }
    60%  { transform: scale(1.08); background: rgba(16,185,129,0.10); }
    100% { transform: scale(1);    background: transparent; }
  }
  @keyframes priceRise {
    0%   { transform: scale(1);   background: transparent; }
    20%  { transform: scale(1.1); background: rgba(239,68,68,0.14); border-radius: 8px; }
    100% { transform: scale(1);   background: transparent; }
  }
  @keyframes badgeIn {
    from { opacity: 0; transform: translateY(-8px) scale(0.8); }
    to   { opacity: 1; transform: translateY(0)    scale(1);   }
  }
  @keyframes pulseGlow {
    0%,100% { box-shadow: 0 0 0 0   rgba(16,185,129,0.5); }
    50%     { box-shadow: 0 0 0 10px rgba(16,185,129,0);   }
  }
  @keyframes liveBlip {
    0%,100% { opacity: 1;   }
    50%     { opacity: 0.1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .pc-price-drop  { animation: priceDrop  0.8s ease-out forwards; }
  .pc-price-rise  { animation: priceRise  0.7s ease-out forwards; }
  .pc-badge-in    { animation: badgeIn    0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .pc-pulse-glow  { animation: pulseGlow  1.8s ease-in-out 3; }
  .pc-live-blip   { animation: liveBlip   1.4s ease-in-out infinite; }
  .pc-slide-up    { animation: slideUp    0.3s ease-out forwards; }
`;

function injectStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById("product-card-styles")) return; // inject once
  const tag = document.createElement("style");
  tag.id = "product-card-styles";
  tag.textContent = STYLES;
  document.head.appendChild(tag);
}

// ── animated number counter ───────────────────────────────────────────────────
function useCountUp(value, duration = 700) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current === value) return;
    const start = prev.current;
    const end = value;
    const startTime = performance.now();

    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * ease));
      if (p < 1) requestAnimationFrame(tick);
      else prev.current = end;
    };

    requestAnimationFrame(tick);
  }, [value, duration]);

  return display;
}

// ─────────────────────────────────────────────────────────────────────────────
const ProductCard = ({ product: initialProduct }) => {
  const router = useRouter();
  const supabase = createClient();

  // inject CSS into <head> on mount
  useEffect(() => { injectStyles(); }, []);

  const [product, setProduct]           = useState(initialProduct);
  const [priceFlash, setPriceFlash]     = useState(null); // "drop" | "rise" | null
  const [dropPct, setDropPct]           = useState(null);
  const prevPrice                        = useRef(initialProduct.current_price);

  const [deleting, setDeleting]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [showChart, setShowChart]       = useState(false);
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [targetInput, setTargetInput]   = useState(initialProduct.target_price || "");
  const [saving, setSaving]             = useState(false);
  const [saved, setSaved]               = useState(false);
  const [imgLoaded, setImgLoaded]       = useState(false);

  const currencyMap = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  const currency    = currencyMap[product.currency] || "₹";
  const animatedPrice = useCountUp(product.current_price ?? 0, 700);

  const isTargetMet =
    product.target_price && product.current_price <= product.target_price;

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

  // ── handlers ──────────────────────────────────────────────────────────────
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
      setTimeout(() => { setSaved(false); setShowTargetInput(false); router.refresh(); }, 600);
    } catch {
      toast.error("Failed ❌");
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

  // ── price color class ─────────────────────────────────────────────────────
  const priceColorClass =
    priceFlash === "drop" ? "text-emerald-500" :
    priceFlash === "rise" ? "text-red-500"     :
    "text-orange-500";

  const priceAnimClass =
    priceFlash === "drop" ? "pc-price-drop" :
    priceFlash === "rise" ? "pc-price-rise"  : "";

  return (
    <Card
      className={`
        flex flex-col overflow-hidden transition-all duration-300
        hover:shadow-xl hover:-translate-y-1
        ${priceFlash === "drop" ? "pc-pulse-glow ring-2 ring-emerald-400/50" : ""}
      `}
    >
      {/* ── IMAGE ──────────────────────────────────────────────────────────── */}
      {product.image_url && (
        <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            priority={false}
            placeholder="empty"
            className={`object-contain p-2 transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
          />

          {/* LIVE badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full z-10">
            <span className="pc-live-blip w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            LIVE
          </div>

          {/* Target met badge */}
          {isTargetMet && (
            <div className="pc-badge-in absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse z-10">
              🎯 Target Reached!
            </div>
          )}

          {/* Price drop % badge */}
          {priceFlash === "drop" && dropPct && (
            <div className="pc-badge-in absolute bottom-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
              <TrendingDown className="w-3 h-3" />
              -{dropPct}%
            </div>
          )}

          {/* Price rise badge */}
          {priceFlash === "rise" && (
            <div className="pc-badge-in absolute bottom-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 shadow-lg">
              ↑ Price up
            </div>
          )}
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <CardHeader className="pb-1 pt-3 px-4">
        <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
      </CardHeader>

      <CardContent className="px-4 pb-3 flex flex-col gap-3 flex-1">

        {/* ── PRICE ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xl font-bold tabular-nums transition-colors duration-300 ${priceColorClass} ${priceAnimClass}`}
            style={{ display: "inline-block" }} /* needed for transform to work on inline */
          >
            {currency} {animatedPrice.toLocaleString("en-IN")}
          </span>

          {priceFlash === "drop" ? (
            <span className="pc-slide-up flex items-center gap-0.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
              <TrendingDown className="w-3 h-3" /> Dropped!
            </span>
          ) : priceFlash === "rise" ? (
            <span className="pc-slide-up text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">
              ↑ Rose
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">↘ Tracking</span>
          )}
        </div>

        {/* ── TARGET BADGE ─────────────────────────────────────────────────── */}
        {product.target_price && (
          <div className={`flex justify-between text-xs px-3 py-2 rounded-lg border transition-all duration-300 ${
            isTargetMet
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-orange-50 border-orange-200 text-orange-700"
          }`}>
            <span>
              🎯 Alert: {currency}{parseFloat(product.target_price).toLocaleString("en-IN")}
            </span>
            <button onClick={handleRemoveTarget} className="text-gray-400 hover:text-red-500">✕</button>
          </div>
        )}

        {/* ── TARGET INPUT ──────────────────────────────────────────────────── */}
        {showTargetInput && (
          <div className="flex gap-2 items-center animate-in fade-in slide-in-from-bottom-2">
            <Input
              type="number"
              placeholder={`Target price (${currency})`}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              className="h-9 text-sm focus:ring-2 focus:ring-orange-400"
            />
            <Button
              size="sm"
              onClick={handleSetTarget}
              disabled={saving || !targetInput}
              className="h-9 bg-orange-500 hover:bg-orange-600 text-white px-4"
            >
              {saved ? <Check className="w-4 h-4" /> : saving ? "…" : "Set"}
            </Button>
          </div>
        )}

        {/* ── CONFIRM DELETE ────────────────────────────────────────────────── */}
        {showConfirm ? (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <span className="text-xs text-red-600 flex-1">Remove this product?</span>
            <button onClick={handleDelete} className="text-xs bg-red-500 text-white px-3 py-1 rounded-md">Yes</button>
            <button onClick={() => setShowConfirm(false)} className="text-xs bg-gray-100 px-3 py-1 rounded-md">No</button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-auto">
            <Button variant="outline" size="sm" asChild className="hover:scale-105 transition">
              <a href={product.url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-3 h-3" /> View
              </a>
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setShowTargetInput(!showTargetInput)}
              className="hover:scale-105 transition"
            >
              {product.target_price ? <BellOff className="w-3 h-3" /> : <Bell className="w-3 h-3" />}
              Alert
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={() => setShowConfirm(true)}
              className="text-red-600 hover:bg-red-50 hover:scale-105 transition"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </Button>
          </div>
        )}

        {/* 🧪 TEMP: test button — delete after confirming animations work */}
        <button
          className="text-[10px] text-gray-300 hover:text-gray-400 underline text-center"
          onClick={() => {
            const fakePrice = (product.current_price ?? 1000) - 500;
            setProduct(p => ({ ...p, current_price: fakePrice }));
            setPriceFlash("drop");
            setDropPct("3.5");
            setTimeout(() => setPriceFlash(null), 2500);
          }}
        >
          [test drop animation]
        </button>

        {/* ── CHART TOGGLE ─────────────────────────────────────────────────── */}
        <button
          onClick={() => setShowChart(!showChart)}
          className="flex justify-center items-center gap-2 text-xs text-muted-foreground hover:text-orange-500 border-t pt-2"
        >
          <BarChart2 className="w-3 h-3" />
          {showChart ? "Hide History" : "Show History"}
        </button>

      </CardContent>

      {showChart && (
        <CardFooter className="pt-0 px-4 pb-4">
          <PriceChart productId={product.id} />
        </CardFooter>
      )}
    </Card>
  );
};

export default ProductCard;