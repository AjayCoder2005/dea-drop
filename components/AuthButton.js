"use client";

import { useState } from "react";
import { signOut } from "@/app/actions";
import { LogIn, LogOut } from "lucide-react";
import AuthModal from "./AuthModal";

export default function AuthButton({ user }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading]     = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
  };

  if (user) {
    return (
      <button
        onClick={handleSignOut}
        disabled={loading}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "transparent",
          color: loading ? "#555566" : "#888899",
          border: "1px solid #222230",
          padding: "7px 14px", borderRadius: 8,
          fontSize: 13, cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "'Sora', sans-serif",
          transition: "all .2s",
        }}
        onMouseEnter={e => {
          if (!loading) {
            e.currentTarget.style.borderColor = "#2a2a3a";
            e.currentTarget.style.color = "#f0f0f5";
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = "#222230";
          e.currentTarget.style.color = "#888899";
        }}
      >
        <LogOut style={{ width: 14, height: 14 }} />
        {loading ? "Signing out..." : "Sign out"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#6c63ff", color: "#fff",
          border: "none", padding: "8px 20px", borderRadius: 8,
          fontSize: 13, fontWeight: 500,
          cursor: "pointer",
          fontFamily: "'Sora', sans-serif",
          transition: "opacity .2s",
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
        onMouseLeave={e => e.currentTarget.style.opacity = "1"}
      >
        <LogIn style={{ width: 14, height: 14 }} />
        Sign in
      </button>

      {/* Modal rendered at this level — always in DOM when showModal=true */}
      <AuthModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}