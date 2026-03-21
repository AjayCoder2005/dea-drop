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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!user) {
      onAuthRequired?.();
      return;
    }

    // Basic URL validation
    try { new URL(url); } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    setLoading(true);
    setStep(0);

    // Cycle through loading steps
    const stepInterval = setInterval(() => {
      setStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }, 4000);

    try {
      const formData = new FormData();
      formData.set("url", url.trim());

      const result = await addProduct(formData);
      clearInterval(stepInterval);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Product added!");
        setUrl("");
      }
    } catch (err) {
      clearInterval(stepInterval);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "620px", margin: "0 auto" }}>
      <div style={{
        display: "flex",
        gap: "0",
        background: "var(--bg-card)",
        border: `1px solid ${loading ? "var(--green-vivid)" : "var(--bg-border-strong)"}`,
        borderRadius: "var(--radius-xl)",
        padding: "6px 6px 6px 20px",
        transition: "border-color 0.3s",
        boxShadow: loading ? "0 0 0 3px rgba(0,232,122,0.08)" : "none",
      }}>
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
          style={{
            padding: "11px 24px",
            borderRadius: "var(--radius-lg)",
            background: loading
              ? "var(--bg-elevated)"
              : "linear-gradient(135deg, #6c63ff, #4f46e5)",
            border: "none",
            color: loading ? "var(--text-muted)" : "#fff",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
            transition: "all 0.2s",
            minWidth: "120px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: "14px", height: "14px",
                border: "2px solid var(--text-muted)",
                borderTopColor: "var(--text-primary)",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.8s linear infinite",
              }}/>
              Tracking...
            </>
          ) : "Track →"}
        </button>
      </div>

      {/* Loading status steps */}
      {loading && (
        <div style={{
          marginTop: "12px",
          textAlign: "center",
          animation: "fadeIn 0.3s ease",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            background: "rgba(0,232,122,0.06)",
            border: "1px solid rgba(0,232,122,0.15)",
            borderRadius: "100px",
            fontSize: "13px",
            color: "var(--green-vivid)",
          }}>
            <span style={{
              width: "6px", height: "6px",
              borderRadius: "50%",
              background: "var(--green-vivid)",
              animation: "pulse 1s ease infinite",
            }}/>
            {STEPS[step]}
          </div>
          <p style={{
            marginTop: "8px",
            fontSize: "12px",
            color: "var(--text-muted)",
          }}>
            This may take up to 30 seconds for some sites
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </form>
  );
}