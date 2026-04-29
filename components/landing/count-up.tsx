"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type CountUpProps = {
  target: number;
  suffix: string;
  label: string;
};

export function CountUp({ target, suffix, label }: CountUpProps) {
  const valueRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!valueRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const obj = { value: 0 };
    const tween = gsap.to(obj, {
      value: target,
      duration: 2.2,
      ease: "power2.out",
      scrollTrigger: { trigger: valueRef.current, start: "top 85%" },
      onUpdate: () => {
        if (!valueRef.current) return;
        valueRef.current.textContent = `${Number.isInteger(target) ? Math.round(obj.value).toLocaleString() : obj.value.toFixed(1)}${suffix}`;
      },
    });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, [suffix, target]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
      <p ref={valueRef} className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-4xl font-bold text-transparent">
        0{suffix}
      </p>
      <p className="mt-2 text-sm text-white/50">{label}</p>
    </div>
  );
}
