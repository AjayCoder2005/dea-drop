"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { X } from "lucide-react";

export default function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        console.error("OAuth error:", error);
        setLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* ── Full viewport backdrop — fixed, covers everything including navbar ── */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          width: "100vw", height: "100vh",
          zIndex: 9999,
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: "bdFadeIn .2s ease",
        }}
      />

      {/* ── Modal — centered in viewport using fixed + transform ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10000,
          width: "calc(100vw - 32px)",
          maxWidth: 420,
          background: "#111118",
          border: "1px solid #2a2a3a",
          borderRadius: 20,
          padding: "32px",
          boxShadow: "0 32px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(108,99,255,0.1)",
          animation: "modalPop .3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "#18181f", border: "1px solid #222230",
            color: "#555566", width: 30, height: 30,
            borderRadius: "50%", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all .2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "#2a2a3a"; e.currentTarget.style.color = "#f0f0f5"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "#18181f"; e.currentTarget.style.color = "#555566"; }}
        >
          <X style={{ width: 14, height: 14 }} />
        </button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36,
            background: "linear-gradient(135deg,#6c63ff,#ff6584)",
            borderRadius: 10, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 16, flexShrink: 0,
          }}>
            💰
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#f0f0f5", letterSpacing: "-0.5px" }}>
            DealDrop
          </span>
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f0f0f5", margin: "0 0 6px", lineHeight: 1.2 }}>
          Sign in to continue
        </h2>
        <p style={{ fontSize: 13, color: "#888899", margin: "0 0 24px", lineHeight: 1.6 }}>
          Track product prices and get instant alerts when they drop
        </p>

        {/* Features */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {[
            { icon: "🔍", text: "Track any product URL" },
            { icon: "📉", text: "Real-time price drop alerts" },
            { icon: "🎯", text: "Set custom target prices" },
            { icon: "📧", text: "Instant email notifications" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#888899" }}>
              <span style={{
                width: 28, height: 28, flexShrink: 0,
                background: "rgba(108,99,255,0.1)",
                border: "1px solid rgba(108,99,255,0.15)",
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
              }}>
                {icon}
              </span>
              {text}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#222230", marginBottom: 20 }} />

        {/* Google button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "13px 20px",
            background: "#ffffff",
            border: "none", borderRadius: 10,
            fontSize: 14, fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Sora', sans-serif",
            color: "#3c4043",
            transition: "opacity .2s, transform .1s",
            opacity: loading ? 0.75 : 1,
          }}
          onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = "0.9"; e.currentTarget.style.transform = "scale(1.01)"; } }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.99)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {loading ? (
            <>
              <div style={{
                width: 18, height: 18, flexShrink: 0,
                border: "2.5px solid rgba(108,99,255,0.3)",
                borderTopColor: "#6c63ff",
                borderRadius: "50%",
                animation: "spin .7s linear infinite",
              }} />
              Redirecting to Google...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p style={{ fontSize: 11, color: "#555566", textAlign: "center", marginTop: 14 }}>
          Free to use · No credit card required
        </p>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes bdFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: translate(-50%, -46%) scale(0.94); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}