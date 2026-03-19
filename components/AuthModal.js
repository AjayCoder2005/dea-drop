"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AuthModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { origin } = window.location;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });
    // no need to setLoading(false) — page will redirect
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            Track product prices and get instant alerts when they drop
          </DialogDescription>
        </DialogHeader>

        {/* Feature list */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 8,
          padding: "4px 0 8px",
        }}>
          {[
            { icon: "🔍", text: "Track any product URL" },
            { icon: "📉", text: "Real-time price drop alerts" },
            { icon: "🎯", text: "Set custom target prices" },
            { icon: "📧", text: "Email notifications via Resend" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#888899" }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#222230", margin: "4px 0" }} />

        {/* Google sign-in button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            width: "100%", padding: "12px 20px",
            background: loading ? "#18181f" : "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: 10, fontSize: 14, fontWeight: 500,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Sora', sans-serif",
            color: "#3c4043",
            transition: "all .2s",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#f8f8f8"; }}
          onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#fff"; }}
        >
          {loading ? (
            <>
              <div style={{
                width: 18, height: 18, border: "2px solid #6c63ff",
                borderTopColor: "transparent", borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }} />
              Redirecting to Google...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p style={{ fontSize: 11, color: "#555566", textAlign: "center", marginTop: 4 }}>
          Free to use · No credit card required
        </p>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}