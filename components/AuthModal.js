"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { X } from "lucide-react";

export default function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error("OAuth error:", error);
        setLoading(false);
      }
      // No setLoading(false) on success — page will redirect
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "fadeIn .2s ease",
      }}
    >
      {/* Modal box — stop click propagation so clicking inside doesn't close */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#111118",
          border: "1px solid #222230",
          borderRadius: 20,
          padding: "32px",
          width: "100%", maxWidth: 400,
          position: "relative",
          animation: "modalIn .25s cubic-bezier(0.34,1.56,0.64,1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      >
        {/* Close button */}
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
            justifyContent: "center", fontSize: 16,
          }}>
            💰
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#f0f0f5", letterSpacing: "-0.5px" }}>
            DealDrop
          </span>
        </div>

        {/* Headline */}
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#f0f0f5", marginBottom: 6, lineHeight: 1.2 }}>
          Sign in to continue
        </h2>
        <p style={{ fontSize: 13, color: "#888899", marginBottom: 24, lineHeight: 1.5 }}>
          Track product prices and get instant alerts when they drop
        </p>

        {/* Feature list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
          {[
            { icon: "🔍", text: "Track any product URL" },
            { icon: "📉", text: "Real-time price drop alerts" },
            { icon: "🎯", text: "Set custom target prices" },
            { icon: "📧", text: "Instant email notifications" },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: "flex", alignItems: "center", gap: 10,
              fontSize: 13, color: "#888899",
            }}>
              <span style={{
                width: 28, height: 28,
                background: "rgba(108,99,255,0.1)",
                borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, flexShrink: 0,
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
            background: loading ? "#f0f0f0" : "#ffffff",
            border: "1px solid #e0e0e0",
            borderRadius: 10, fontSize: 14, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Sora', sans-serif",
            color: "#3c4043",
            transition: "all .2s",
            opacity: loading ? 0.8 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#f8f8f8"; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#ffffff"; }}
        >
          {loading ? (
            <>
              <div style={{
                width: 18, height: 18,
                border: "2px solid #6c63ff",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin .7s linear infinite",
                flexShrink: 0,
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

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}