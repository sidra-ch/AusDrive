"use client";

import { RefObject, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Direction = "top" | "bottom" | "left" | "right";

export function useGsapReveal(
  ref: RefObject<HTMLElement | null>,
  direction: Direction = "bottom",
  stagger = 0.12,
) {
  useEffect(() => {
    if (!ref.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const axis = direction === "left" || direction === "right" ? "x" : "y";
    const offset =
      direction === "top" || direction === "left"
        ? -60
        : 60;

    const q = gsap.utils.selector(ref);
    const items = q("[data-reveal]");
    if (!items.length) return;

    const tween = gsap.fromTo(
      items,
      { opacity: 0, [axis]: offset },
      {
        opacity: 1,
        [axis]: 0,
        duration: 1,
        stagger,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [direction, ref, stagger]);
}
