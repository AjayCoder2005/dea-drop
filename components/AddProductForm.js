"use client";

import { useState } from "react";
import { addProduct } from "@/app/actions";
import AuthModal from "./AuthModal";
import { Loader2, Target } from "lucide-react";
import { toast } from "sonner";

export default function AddProductForm({ user }) {
  const [url, setUrl]                     = useState("");
  const [targetPrice, setTargetPrice]     = useState("");
  const [showTarget, setShowTarget]       = useState(false);
  const [loading, setLoading]             = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!url.trim()) return;

    // Basic URL validation
    try { new URL(url); } catch {
      toast.error("Please enter a valid product URL");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Scraping product details...");

    const formData = new FormData();
    formData.append("url", url.trim());
    if (targetPrice) formData.append("targetPrice", targetPrice);

    const result = await addProduct(formData);

    if (result.error) {
      toast.error(result.error, { id: toastId });
    } else {
      toast.success(result.message || "✅ Product is now being tracked!", { id: toastId });
      setUrl("");
      setTargetPrice("");
      setShowTarget(false);
    }

    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 580, margin: "0 auto" }}>

        {/* URL input row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "#111118",
          border: `1px solid ${loading ? "rgba(108,99,255,0.4)" : "#2a2a3a"}`,
          borderRadius: 14, padding: "10px 10px 10px 18px",
          transition: "border-color .2s",
          boxShadow: loading ? "0 0 0 3px rgba(108,99,255,0.1)" : "none",
        }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Amazon, Flipkart, Myntra, Zara URL..."
            required
            disabled={loading}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "#f0f0f5", fontSize: 14, fontFamily: "'Sora', sans-serif",
              opacity: loading ? 0.6 : 1,
            }}
          />

          {/* Target price toggle */}
          <button
            type="button"
            onClick={() => setShowTarget(!showTarget)}
            title="Set target price alert"
            style={{
              background: showTarget ? "rgba(108,99,255,0.15)" : "transparent",
              color: showTarget ? "#6c63ff" : "#555566",
              border: `1px solid ${showTarget ? "rgba(108,99,255,0.3)" : "transparent"}`,
              padding: "6px 10px", borderRadius: 8,
              fontSize: 12, cursor: "pointer",
              transition: "all .2s", flexShrink: 0,
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            <Target style={{ width: 14, height: 14 }} />
          </button>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !url.trim()}
            style={{
              background: loading ? "#2a2a3a" : "#6c63ff",
              color: "#fff", border: "none",
              padding: "10px 22px", borderRadius: 10,
              fontSize: 13, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Sora', sans-serif",
              transition: "all .2s", flexShrink: 0,
              display: "flex", alignItems: "center", gap: 8,
              opacity: !url.trim() ? 0.5 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                Scraping...
              </>
            ) : (
              "Track →"
            )}
          </button>
        </div>

        {/* Target price row — slides in */}
        {showTarget && (
          <div style={{
            marginTop: 10,
            display: "flex", alignItems: "center", gap: 10,
            background: "#18181f",
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: 10, padding: "10px 16px",
            animation: "slideDown 0.2s ease",
          }}>
            <Target style={{ width: 14, height: 14, color: "#f59e0b", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#888899", whiteSpace: "nowrap" }}>
              Alert me when price drops below
            </span>
            <input
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="e.g. 999"
              min="0"
              step="0.01"
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "#f59e0b", fontSize: 14, fontFamily: "'DM Mono', monospace",
                textAlign: "right",
              }}
            />
          </div>
        )}

        {/* Hint for non-logged-in users */}
        {!user && (
          <p style={{ fontSize: 12, color: "#555566", marginTop: 10, textAlign: "center" }}>
            Sign in with Google to start tracking →
          </p>
        )}
      </form>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}