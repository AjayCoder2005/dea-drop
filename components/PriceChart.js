"use client";

import { useEffect, useState, useId } from "react";
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

const currencySymbol = (c) =>
  ({ INR: "₹", USD: "$", EUR: "€", GBP: "£" }[c] || "₹");

const CustomTooltip = ({ active, payload, label, symbol }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#18181f", border: "1px solid #2a2a3a",
      borderRadius: 10, padding: "8px 14px",
    }}>
      <p style={{ fontSize: 11, color: "#555566", marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#22c55e", fontFamily: "'DM Mono', monospace" }}>
        {symbol}{payload[0].value.toLocaleString("en-IN")}
      </p>
    </div>
  );
};

const PriceChart = ({ productId, currency = "INR" }) => {
  // useId gives a unique stable ID per component instance — fixes gradient conflicts
  const uid = useId().replace(/:/g, "");
  const gradientId = `grad-${uid}`;

  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [animate, setAnimate]           = useState(false);
  const symbol = currencySymbol(currency);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setAnimate(false);

      const res = await fetch(`/api/price-history/${productId}`);
      if (!res.ok) throw new Error(`Failed to fetch (${res.status})`);

      const data = await res.json();
      const formatted = data.map((entry) => ({
        price: parseFloat(entry.price),
        date:  new Date(entry.checked_at).toLocaleDateString("en-IN", {
          month: "short", day: "numeric",
        }),
      }));

      setPriceHistory(formatted);
      setTimeout(() => setAnimate(true), 80);
    } catch (err) {
      console.error("PriceChart error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchData();
  }, [productId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        width: "100%", height: 160,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
      }}>
        <div style={{ display: "flex", gap: 4, alignItems: "flex-end" }}>
          {[0,1,2,3,4].map((i) => (
            <div key={i} style={{
              width: 4, borderRadius: 2,
              background: "#6c63ff",
              height: 12 + i * 5,
              transformOrigin: "bottom",
              animation: "pcBounce .8s ease-in-out infinite",
              animationDelay: `${i * 0.1}s`,
            }} />
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#555566" }}>Loading price history...</p>
        <style>{`
          @keyframes pcBounce {
            0%,100% { transform: scaleY(1);   }
            50%      { transform: scaleY(1.7); }
          }
        `}</style>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ width: "100%", padding: "20px 0", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#f43f5e", marginBottom: 10 }}>⚠️ Could not load price history</p>
        <button
          onClick={fetchData}
          style={{ background: "transparent", border: "1px solid #2a2a3a", color: "#888899", borderRadius: 8, padding: "5px 16px", fontSize: 11, cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "#6c63ff"; e.currentTarget.style.color = "#6c63ff"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "#2a2a3a"; e.currentTarget.style.color = "#888899"; }}
        >
          ↺ Retry
        </button>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!priceHistory.length) {
    return (
      <div style={{
        width: "100%", height: 100, marginTop: 12,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 6,
        background: "#18181f", borderRadius: 10, border: "1px solid #222230",
      }}>
        <div style={{ fontSize: 24 }}>📊</div>
        <p style={{ fontSize: 12, color: "#6c63ff", fontWeight: 500 }}>No price history yet</p>
        <p style={{ fontSize: 11, color: "#555566" }}>Check back after the first daily update</p>
      </div>
    );
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const prices = priceHistory.map((p) => p.price);
  const first  = prices[0];
  const last   = prices[prices.length - 1];
  const min    = Math.min(...prices);
  const max    = Math.max(...prices);
  const change = last - first;
  const pct    = ((change / first) * 100).toFixed(1);
  const isDown = change < 0;
  const isUp   = change > 0;

  return (
    <div style={{
      width: "100%", paddingTop: 14,
      opacity:    animate ? 1 : 0,
      transform:  animate ? "translateY(0)" : "translateY(8px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    }}>

      {/* Stats row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        {isDown ? (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "3px 10px", borderRadius: 20 }}>
            <TrendingDown style={{ width: 11, height: 11 }} />{Math.abs(pct)}% drop
          </span>
        ) : isUp ? (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#f43f5e", background: "rgba(244,63,94,0.1)", padding: "3px 10px", borderRadius: 20 }}>
            <TrendingUp style={{ width: 11, height: 11 }} />{pct}% rise
          </span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#555566", background: "#18181f", padding: "3px 10px", borderRadius: 20 }}>
            <Minus style={{ width: 11, height: 11 }} />No change
          </span>
        )}
        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#555566" }}>
          <span>Low: <span style={{ color: "#22c55e", fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{symbol}{min.toLocaleString("en-IN")}</span></span>
          <span>High: <span style={{ color: "#f43f5e", fontWeight: 600, fontFamily: "'DM Mono',monospace" }}>{symbol}{max.toLocaleString("en-IN")}</span></span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={priceHistory} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              {/* ✅ unique gradient ID per card instance — no cross-card bleed */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#555566", fontFamily: "'DM Mono',monospace" }}
              tickLine={false} axisLine={false} dy={5}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#555566", fontFamily: "'DM Mono',monospace" }}
              tickLine={false} axisLine={false}
              tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}k`}
              width={48} domain={["auto", "auto"]}
            />
            <Tooltip
              content={<CustomTooltip symbol={symbol} />}
              cursor={{ stroke: "#6c63ff", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone" dataKey="price"
              stroke="#22c55e" strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={{ r: 3, fill: "#22c55e", stroke: "#111118", strokeWidth: 2 }}
              activeDot={{ r: 5, fill: "#22c55e", stroke: "#111118", strokeWidth: 2 }}
              animationDuration={1200} animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p style={{ textAlign: "center", fontSize: 10, color: "#333340", marginTop: 6 }}>
        {priceHistory.length} data point{priceHistory.length !== 1 ? "s" : ""} tracked
      </p>
    </div>
  );
};

export default PriceChart;