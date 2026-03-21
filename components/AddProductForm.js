"use client";
import { useState } from "react";
import { addProduct } from "@/app/actions";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const STEPS = [
  "Fetching product page...",
  "Extracting price & details...",
  "Saving to your tracker...",
];

export default function AddProductForm({ user }) {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep]       = useState(0);
  const [hovered, setHovered] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleGoogleSignIn = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    // ✅ Show auth modal if not signed in
    if (!user) {
      setShowAuthModal(true);
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
        @keyframes modalIn {
          from { opacity:0; transform:scale(0.95) translateY(10px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .track-btn {
          padding: 13px 28px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #7c3aed, #6c63ff, #4f46e5);
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
          box-shadow: 0 4px 15px rgba(108,99,255,0.35);
          min-width: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--font-body);
        }
        .track-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(108,99,255,0.5);
        }
        .track-btn:active:not(:disabled) {
          transform: translateY(0px);
        }
        .track-btn:disabled {
          background: var(--bg-elevated);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .google-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: 1px solid var(--bg-border-strong);
          background: var(--bg-elevated);
          color: var(--text-primary);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          font-family: var(--font-body);
        }
        .google-btn:hover {
          background: var(--bg-card);
          border-color: rgba(108,99,255,0.4);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
      `}</style>

      {/* Auth Modal */}
      {showAuthModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowAuthModal(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--bg-border-strong)",
            borderRadius: "20px",
            padding: "36px 32px",
            maxWidth: "400px",
            width: "100%",
            animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
            textAlign: "center",
          }}>
            {/* Close button */}
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                position: "absolute", top: "16px", right: "16px",
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", fontSize: "18px",
              }}
            >✕</button>

            {/* Icon */}
            <div style={{
              width: "56px", height: "56px", borderRadius: "16px",
              background: "linear-gradient(135deg, #7c3aed, #6c63ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "24px", margin: "0 auto 20px",
            }}>💰</div>

            <h2 style={{
              fontFamily: "var(--font-display)", fontSize: "22px",
              fontWeight: 700, color: "var(--text-primary)",
              marginBottom: "8px", letterSpacing: "-0.02em",
            }}>
              Sign in to track prices
            </h2>
            <p style={{
              fontSize: "14px", color: "var(--text-secondary)",
              marginBottom: "28px", lineHeight: 1.6,
            }}>
              Create a free account to track unlimited products and get instant price drop alerts.
            </p>

            {/* Google Sign In Button */}
            <button onClick={handleGoogleSignIn} className="google-btn">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p style={{
              fontSize: "12px", color: "var(--text-muted)",
              marginTop: "16px",
            }}>
              Free forever · No credit card required
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "640px", margin: "0 auto" }}>
        <div style={{
          display: "flex",
          gap: "8px",
          background: "var(--bg-card)",
          border: `1.5px solid ${loading ? "rgba(108,99,255,0.5)" : hovered ? "var(--bg-border-strong)" : "var(--bg-border)"}`,
          borderRadius: "18px",
          padding: "6px 6px 6px 20px",
          transition: "border-color 0.25s, box-shadow 0.25s",
          boxShadow: loading ? "0 0 0 4px rgba(108,99,255,0.08)" : "none",
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
              flex: 1, background: "transparent", border: "none",
              outline: "none", color: "var(--text-primary)",
              fontSize: "14px", fontFamily: "var(--font-body)",
              padding: "8px 0", minWidth: 0,
            }}
          />
          <button type="submit" disabled={loading || !url.trim()} className="track-btn">
            {loading
              ? <><span style={{
                  width: "15px", height: "15px",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff", borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}/> Tracking...</>
              : <>Track →</>
            }
          </button>
        </div>

        {/* Loading steps */}
        {loading && (
          <div style={{ marginTop: "14px", textAlign: "center", animation: "slideDown 0.3s ease" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "9px 20px",
              background: "rgba(108,99,255,0.08)",
              border: "1px solid rgba(108,99,255,0.2)",
              borderRadius: "100px", fontSize: "13px", color: "#a78bfa",
            }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%",
                background: "#6c63ff", animation: "blink 1.2s ease infinite",
              }}/>
              {STEPS[step]}
            </div>
          </div>
        )}
      </form>
    </>
  );
}