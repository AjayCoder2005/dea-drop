"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getPriceHistory } from "@/app/actions";

const PriceChart = ({ productId }) => {
  const [priceHistory, setPriceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPriceHistory(productId);
        console.log("Price history:", data); // debug

        const formatted = data.map((entry) => ({
          price: entry.price,
          currency: entry.currency || "INR",
          date: new Date(entry.checked_at).toLocaleDateString("en-IN", { // ✅ FIXED
            month: "short",
            day: "numeric",
          }),
        }));

        setPriceHistory(formatted);
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
      <div className="flex items-center justify-center w-full h-24 text-sm text-muted-foreground">
        Loading chart...
      </div>
    );
  }

  if (!priceHistory.length) {
    return (
      <div className="flex items-center justify-center w-full h-24 text-sm text-muted-foreground">
        No price history yet. Check back after the first daily update!
      </div>
    );
  }

  const currency = priceHistory[0]?.currency;
  const symbol = currency === "INR" ? "₹" : "$";

  return (
    <div className="w-full h-40 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={priceHistory}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${symbol}${v.toLocaleString("en-IN")}`}
            width={70}
          />
          <Tooltip
            formatter={(value) => [
              `${symbol}${value.toLocaleString("en-IN")}`,
              "Price",
            ]}
            contentStyle={{
              fontSize: 12,
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 3, fill: "#f97316" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;