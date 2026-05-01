"use client";

import { useEffect, useState } from "react";

export function PremiumFullscreenLoader() {
  const [phase, setPhase] = useState<"visible" | "fading" | "hidden">("visible");

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase("fading"), 2000);
    const hideTimer = setTimeout(() => setPhase("hidden"), 2800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#F5F7FA",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "48px",
        transition: "opacity 0.8s ease",
        opacity: phase === "fading" ? 0 : 1,
      }}
    >
      {/* Car track */}
      <div style={{ position: "relative", width: "280px", height: "110px", display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* Moving car wrapper */}
        <div
          style={{
            animation: "ausdrive-car-slide 1.8s ease-in-out infinite alternate",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {/* Red Car SVG */}
          <svg width="100" height="52" viewBox="0 0 100 52" xmlns="http://www.w3.org/2000/svg">
            {/* Shadow */}
            <ellipse cx="50" cy="50" rx="36" ry="4" fill="#00000015" />
            {/* Body */}
            <rect x="8" y="26" width="84" height="20" rx="4" fill="#E8263A" />
            {/* Roof */}
            <path d="M22 26 L30 10 L70 10 L78 26 Z" fill="#C8192C" />
            {/* Front windshield */}
            <path d="M68 26 L74 14 L70 10 L70 26 Z" fill="#93C5FD" opacity="0.85" />
            {/* Rear windshield */}
            <path d="M32 26 L26 14 L30 10 L30 26 Z" fill="#93C5FD" opacity="0.85" />
            {/* Middle window */}
            <rect x="34" y="12" width="32" height="13" rx="2" fill="#BFDBFE" opacity="0.9" />
            {/* Left headlight */}
            <rect x="88" y="32" width="6" height="5" rx="1.5" fill="#FDE68A" />
            {/* Right tail light */}
            <rect x="6" y="32" width="5" height="5" rx="1.5" fill="#FCA5A5" />
            {/* Door line */}
            <line x1="50" y1="26" x2="50" y2="46" stroke="#C8192C" strokeWidth="1" />
            {/* Wheel left */}
            <circle cx="25" cy="45" r="8" fill="#1F2937" />
            <circle cx="25" cy="45" r="4" fill="#374151" />
            <circle cx="25" cy="45" r="1.5" fill="#9CA3AF" />
            {/* Wheel right */}
            <circle cx="75" cy="45" r="8" fill="#1F2937" />
            <circle cx="75" cy="45" r="4" fill="#374151" />
            <circle cx="75" cy="45" r="1.5" fill="#9CA3AF" />
            {/* Headlight glow */}
            <ellipse cx="95" cy="34" rx="5" ry="3" fill="#FDE68A" opacity="0.4" />
          </svg>
        </div>

        {/* Road */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            borderRadius: "2px",
            background: "linear-gradient(to right, transparent, #E8263A55, #E8263A, #E8263A55, transparent)",
          }}
        />

        {/* Road dashes */}
        <div style={{ position: "absolute", bottom: "10px", left: 0, right: 0, display: "flex", justifyContent: "space-between", paddingInline: "16px" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: "28px",
                height: "2px",
                borderRadius: "1px",
                backgroundColor: "#CBD5E1",
                animation: `ausdrive-dash-fade 1.2s ease-in-out ${i * 0.18}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Text */}
      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "8px", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "26px", fontWeight: 700, color: "#1A1D1F", letterSpacing: "-0.5px", fontFamily: "var(--font-poppins, sans-serif)" }}>
            AusDrive
          </span>
          <span style={{ fontSize: "26px", fontWeight: 700, color: "#E8263A", letterSpacing: "-0.5px", fontFamily: "var(--font-poppins, sans-serif)" }}>
            Premium
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px", color: "#6F767E", letterSpacing: "0.3px" }}>Starting your ride</span>
          {/* Pulsing dot */}
          <div style={{ display: "flex", gap: "4px" }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  backgroundColor: "#E8263A",
                  animation: `ausdrive-dot-bounce 0.9s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes ausdrive-car-slide {
          0%   { transform: translateX(-60px); }
          100% { transform: translateX(60px); }
        }
        @keyframes ausdrive-dash-fade {
          0%   { opacity: 0.2; }
          100% { opacity: 0.8; }
        }
        @keyframes ausdrive-dot-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
