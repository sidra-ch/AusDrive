"use client";

import { useEffect, useState } from "react";

export function PremiumFullscreenLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B0B] transition-opacity duration-1000 ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0B0B] via-[#1a1a2e] to-[#0B0B0B] opacity-50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-8">
        {/* Car animation */}
        <div className="relative w-80 h-40">
          {/* Road lines */}
          <div className="absolute inset-0 flex flex-col justify-center gap-2 opacity-20">
            <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
            <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
            <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />
          </div>

          {/* Car SVG */}
          <svg
            className="absolute inset-0 w-full h-full animate-bounce"
            viewBox="0 0 200 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Car body */}
            <g className="animate-pulse">
              {/* Main chassis */}
              <rect
                x="40"
                y="50"
                width="120"
                height="30"
                rx="4"
                fill="none"
                stroke="#00d9ff"
                strokeWidth="2"
              />

              {/* Car top */}
              <path
                d="M 60 50 L 70 30 L 130 30 L 140 50"
                fill="none"
                stroke="#00d9ff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Windows */}
              <rect
                x="72"
                y="35"
                width="20"
                height="12"
                fill="none"
                stroke="#00d9ff"
                strokeWidth="1.5"
                opacity="0.6"
              />
              <rect
                x="108"
                y="35"
                width="20"
                height="12"
                fill="none"
                stroke="#00d9ff"
                strokeWidth="1.5"
                opacity="0.6"
              />

              {/* Headlights */}
              <circle cx="45" cy="60" r="3" fill="#FFD700" opacity="0.8" />
              <circle cx="155" cy="60" r="3" fill="#FFD700" opacity="0.8" />

              {/* Wheels */}
              <circle cx="65" cy="82" r="8" fill="none" stroke="#00d9ff" strokeWidth="2" />
              <circle cx="135" cy="82" r="8" fill="none" stroke="#00d9ff" strokeWidth="2" />
            </g>
          </svg>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cyan-400 bg-clip-text text-transparent">
            AusDrive Premium
          </h1>
          <p className="text-lg text-gray-400 tracking-wide">Starting your ride...</p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0s" }} />
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-radial-gradient from-cyan-400/10 to-transparent opacity-30 pointer-events-none" />
    </div>
  );
}
