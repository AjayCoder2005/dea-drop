"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/utils/supabase/client";
import { X } from "lucide-react";

export default function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

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
      if (error) { console.error("OAuth error:", error); setLoading(false); }
    } catch (err) {
      console.error("Login error:", err);
      setLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes bdFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes modalPop  { from{opacity:0;transform:scale(0.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spinRing  { to{transform:rotate(360deg)} }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 99998,
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          animation: "bdFadeIn .2s ease",
        }}
      />

      {/* Scroll container — handles overflow on small screens */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 99999,
          overflowY: "auto",
          display: "flex",
          alignItems: "flex-start",        // start so scrolling works naturally
          justifyContent: "center",
          padding: "40px 16px 40px",       // top padding pushes modal down from edge
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            width: "100%", maxWidth: 400,
            background: "#111118",
            border: "1px solid #2a2a3a",
            borderRadius: 20,
            padding: "28px 28px 24px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(108,99,255,0.08)",
            animation: "modalPop .3s cubic-bezier(0.34,1.56,0.64,1)",
            margin: "auto 0",              // vertical centering when content fits
          }}
        >
          {/* Close */}
          <button
            type="button" onClick={onClose}
            style={{ position: "absolute", top: 14, right: 14, background: "#18181f", border: "1px solid #222230", color: "#555566", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#2a2a3a"; e.currentTarget.style.color = "#f0f0f5"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#18181f"; e.currentTarget.style.color = "#555566"; }}
          >
            <X style={{ width: 13, height: 13 }} />
          </button>

          {/* Logo + headline — row layout to save vertical space */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#6c63ff,#ff6584)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>
              💰
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f5", letterSpacing: "-0.4px", lineHeight: 1.2 }}>Sign in to DealDrop</div>
              <div style={{ fontSize: 11, color: "#555566", marginTop: 2 }}>Track prices. Get alerts. Save money.</div>
            </div>
          </div>

          {/* Features — 2-column grid to reduce height */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
            {[
              { icon: "🔍", text: "Track any URL" },
              { icon: "📉", text: "Price drop alerts" },
              { icon: "🎯", text: "Target price" },
              { icon: "📧", text: "Email alerts" },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#888899", background: "rgba(108,99,255,0.05)", border: "1px solid rgba(108,99,255,0.1)", borderRadius: 8, padding: "8px 10px" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                {text}
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#1e1e2a", marginBottom: 16 }} />

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              width: "100%", padding: "12px 20px",
              background: "#ffffff", border: "none", borderRadius: 10,
              fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Sora', sans-serif",
              color: "#3c4043",
              transition: "opacity .2s, transform .15s",
              opacity: loading ? 0.75 : 1,
              boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "scale(1.01)"; }}}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
            onMouseDown={e => { e.currentTarget.style.transform = "scale(0.985)"; }}
            onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {loading ? (
              <>
                <div style={{ width: 17, height: 17, border: "2.5px solid rgba(108,99,255,0.25)", borderTopColor: "#6c63ff", borderRadius: "50%", animation: "spinRing .7s linear infinite", flexShrink: 0 }} />
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

          <p style={{ fontSize: 11, color: "#333340", textAlign: "center", marginTop: 12 }}>
            Free to use · No credit card required
          </p>
        </div>
      </div>
    </>,
    document.body
  );
}