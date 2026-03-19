"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getPriceHistory } from "@/app/actions";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

const CustomTooltip = ({ active, payload, label, symbol }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-orange-100 rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-base font-bold text-orange-500">
          {symbol}{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

const PriceChart = ({ productId }) => {
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPriceHistory(productId);

        const formatted = data.map((entry) => ({
          price: parseFloat(entry.price),
          currency: entry.currency || "INR",
          date: new Date(entry.checked_at).toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
          }),
        }));

        setPriceHistory(formatted);
        setTimeout(() => setAnimate(true), 100);
      } catch (err) {
        console.error("PriceChart error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchData();
  }, [productId]);

  if (loading) {
    return (
      <div className="w-full h-48 flex flex-col items-center justify-center gap-3">
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-orange-400 animate-bounce"
              style={{
                height: `${12 + i * 6}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Loading price history...</p>
      </div>
    );
  }

  if (!priceHistory.length) {
    return (
      <div className="w-full h-32 flex flex-col items-center justify-center gap-2 bg-orange-50 rounded-xl border border-orange-100">
        <div className="text-2xl">📊</div>
        <p className="text-xs text-orange-600 font-medium">No price history yet</p>
        <p className="text-xs text-gray-400">Check back after the first daily update!</p>
      </div>
    );
  }

  const currency = priceHistory[0]?.currency;
  const symbol = currency === "INR" ? "₹" : "$";

  const firstPrice = priceHistory[0]?.price;
  const lastPrice = priceHistory[priceHistory.length - 1]?.price;
  const minPrice = Math.min(...priceHistory.map((p) => p.price));
  const maxPrice = Math.max(...priceHistory.map((p) => p.price));
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = ((priceChange / firstPrice) * 100).toFixed(1);
  const isDown = priceChange < 0;
  const isUp = priceChange > 0;

  return (
    <div
      className={`w-full transition-all duration-700 ${
        animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Stats Row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          {isDown ? (
            <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg text-xs font-semibold">
              <TrendingDown className="w-3 h-3" />
              {Math.abs(priceChangePercent)}% drop
            </div>
          ) : isUp ? (
            <div className="flex items-center gap-1 bg-red-50 text-red-500 px-2 py-1 rounded-lg text-xs font-semibold">
              <TrendingUp className="w-3 h-3" />
              {priceChangePercent}% rise
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded-lg text-xs font-semibold">
              <Minus className="w-3 h-3" />
              No change
            </div>
          )}
        </div>

        <div className="flex gap-3 text-xs text-gray-400">
          <span>
            Low:{" "}
            <span className="text-green-600 font-semibold">
              {symbol}{minPrice.toLocaleString("en-IN")}
            </span>
          </span>
          <span>
            High:{" "}
            <span className="text-red-500 font-semibold">
              {symbol}{maxPrice.toLocaleString("en-IN")}
            </span>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={priceHistory}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id={`gradient-${productId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f3f4f6"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              dy={5}
            />

            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${symbol}${(v / 1000).toFixed(0)}k`}
              width={45}
              domain={["auto", "auto"]}
            />

            <Tooltip
              content={<CustomTooltip symbol={symbol} />}
              cursor={{
                stroke: "#f97316",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />

            <Area
              type="monotone"
              dataKey="price"
              stroke="#f97316"
              strokeWidth={2.5}
              fill={`url(#gradient-${productId})`}
              dot={{
                r: 3,
                fill: "#f97316",
                stroke: "#fff",
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
                fill: "#f97316",
                stroke: "#fff",
                strokeWidth: 2,
                filter: "drop-shadow(0 0 4px rgba(249,115,22,0.5))",
              }}
              animationDuration={1500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Data points count */}
      <p className="text-center text-xs text-gray-300 mt-1">
        {priceHistory.length} data points tracked
      </p>
    </div>
  );
};

export default PriceChart;