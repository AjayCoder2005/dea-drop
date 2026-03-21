"use client";
import { useState } from "react";
import { addProduct } from "@/app/actions";
import { toast } from "sonner";

const STEPS = [
  "Fetching product page...",
  "Extracting price & details...",
  "Saving to your tracker...",
];

export default function AddProductForm({ user, onAuthRequired }) {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(0);
  const [hovered, setHovered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!user) {
      onAuthRequired?.();
      return;
    }

    try { new URL(url); } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setStep(0);

    const stepInterval = setInterval(() => {
      setStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 8000);

    try {
      const formData = new FormData();
      formData.set("url", url.trim());
      const result = await addProduct(formData);
      clearInterval(stepInterval);

      if (result?.error) toast.error(result.error);
      else { toast.success(result.message || "Product added!"); setUrl(""); }
    } catch {
      clearInterval(stepInterval);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .track-btn {
          padding: 13px 28px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #7c3aed, #6c63ff, #4f46e5);
          background-size: 200% 200%;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          letter-spacing: 0.2px;
          box-shadow: 0 4px 15px rgba(108,99,255,0.35);
          min-width: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--font-body);
          position: relative;
          overflow: hidden;
        }
        .track-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(108,99,255,0.5);
          background-position: right center;
        }
        .track-btn:active:not(:disabled) {
          transform: translateY(0px);
          box-shadow: 0 4px 12px rgba(108,99,255,0.3);
        }
        .track-btn:disabled {
          background: var(--bg-elevated);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .track-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .track-btn:hover:not(:disabled)::after { opacity: 1; }
        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
      `}</style>

      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "640px", margin: "0 auto" }}>
        {/* Input row */}
        <div style={{
          display: "flex",
          gap: "8px",
          background: "var(--bg-card)",
          border: `1.5px solid ${loading ? "rgba(108,99,255,0.5)" : hovered ? "var(--bg-border-strong)" : "var(--bg-border)"}`,
          borderRadius: "18px",
          padding: "6px 6px 6px 20px",
          transition: "border-color 0.25s, box-shadow 0.25s",
          boxShadow: loading
            ? "0 0 0 4px rgba(108,99,255,0.08)"
            : hovered
            ? "0 0 0 3px rgba(255,255,255,0.04)"
            : "none",
        }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="Paste Amazon, Flipkart or Walmart product URL..."
            disabled={loading}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontSize: "14px",
              fontFamily: "var(--font-body)",
              padding: "8px 0",
              minWidth: 0,
            }}
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="track-btn"
          >
            {loading
              ? <><span className="spinner"/> Tracking...</>
              : <>Track →</>
            }
          </button>
        </div>

        {/* Loading status — only shown while loading */}
        {loading && (
          <div style={{
            marginTop: "14px",
            textAlign: "center",
            animation: "slideDown 0.3s ease",
          }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 20px",
              background: "rgba(108,99,255,0.08)",
              border: "1px solid rgba(108,99,255,0.2)",
              borderRadius: "100px",
              fontSize: "13px",
              color: "#a78bfa",
            }}>
              <span style={{
                width: "7px", height: "7px",
                borderRadius: "50%",
                background: "#6c63ff",
                animation: "blink 1.2s ease infinite",
                flexShrink: 0,
              }}/>
              {STEPS[step]}
            </div>
          </div>
        )}
      </form>
    </>
  );
}