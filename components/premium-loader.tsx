"use client";

import { useEffect, useState } from "react";
import styles from "./premium-loader.module.css";

export function PremiumLoader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`${styles.loaderContainer} ${!isVisible ? styles.fadeOut : ""}`}>
      {/* Background gradient */}
      <div className={styles.background} />

      {/* Main content */}
      <div className={styles.content}>
        {/* Animated car loader */}
        <div className={styles.carLoaderWrapper}>
          {/* Road lines */}
          <div className={styles.roadContainer}>
            <div className={styles.roadLine} />
            <div className={styles.roadLine} />
            <div className={styles.roadLine} />
          </div>

          {/* Car SVG */}
          <svg
            className={styles.carSvg}
            viewBox="0 0 200 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Car body */}
            <g className={styles.carBody}>
              {/* Main chassis */}
              <rect x="40" y="50" width="120" height="30" rx="4" fill="none" stroke="#00D9FF" strokeWidth="2" />

              {/* Car top */}
              <path
                d="M 60 50 L 70 30 L 130 30 L 140 50"
                fill="none"
                stroke="#00D9FF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Windows */}
              <rect x="72" y="35" width="20" height="12" fill="none" stroke="#00D9FF" strokeWidth="1.5" opacity="0.6" />
              <rect x="108" y="35" width="20" height="12" fill="none" stroke="#00D9FF" strokeWidth="1.5" opacity="0.6" />

              {/* Headlights */}
              <circle cx="45" cy="60" r="3" fill="#FFD700" opacity="0.8" />
              <circle cx="155" cy="60" r="3" fill="#FFD700" opacity="0.8" />

              {/* Wheels */}
              <circle cx="65" cy="82" r="8" fill="none" stroke="#00D9FF" strokeWidth="2" />
              <circle cx="135" cy="82" r="8" fill="none" stroke="#00D9FF" strokeWidth="2" />

              {/* Wheel details */}
              <circle cx="65" cy="82" r="4" fill="none" stroke="#00D9FF" strokeWidth="1" opacity="0.5" />
              <circle cx="135" cy="82" r="4" fill="none" stroke="#00D9FF" strokeWidth="1" opacity="0.5" />
            </g>

            {/* Speed lines */}
            <g className={styles.speedLines} opacity="0.6">
              <line x1="20" y1="55" x2="35" y2="55" stroke="#00D9FF" strokeWidth="1.5" />
              <line x1="15" y1="65" x2="30" y2="65" stroke="#00D9FF" strokeWidth="1.5" />
              <line x1="25" y1="75" x2="38" y2="75" stroke="#00D9FF" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        {/* Brand text */}
        <div className={styles.textContainer}>
          <h1 className={styles.brandName}>AusDrive Premium</h1>
          <p className={styles.tagline}>Premium Car Rental Experience</p>
        </div>

        {/* Loading indicator */}
        <div className={styles.loadingIndicator}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      </div>

      {/* Ambient glow effect */}
      <div className={styles.glowEffect} />
    </div>
  );
}
