"use client";

import { useEffect, useRef } from "react";
import { useScroll, useTransform, useMotionValue, animate } from "framer-motion";

import { useGsapReveal } from "@/hooks/use-gsap-reveal";
import { BudgetVsLuxurySection } from "@/components/landing/sections/budget-vs-luxury-section";
import { CarCategoriesSection } from "@/components/landing/sections/car-categories-section";
import { CtaSection } from "@/components/landing/sections/cta-section";
import { DealsCarouselSection } from "@/components/landing/sections/deals-carousel-section";
import { FaqSection } from "@/components/landing/sections/faq-section";
import { FeaturesSection } from "@/components/landing/sections/features-section";
import { FooterSection } from "@/components/landing/sections/footer-section";
import { HeroSection } from "@/components/landing/sections/hero-section";
import { LocationsSection } from "@/components/landing/sections/locations-section";
import { NavbarSection } from "@/components/landing/sections/navbar-section";
import { OverlapStatsSection } from "@/components/landing/sections/overlap-stats-section";
import { SaasTrackingSection } from "@/components/landing/sections/saas-tracking-section";
import { StatsCounterSection } from "@/components/landing/sections/stats-counter-section";
import { TestimonialsSection } from "@/components/landing/sections/testimonials-section";

export default function LandingPage() {
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const categoriesRef = useRef<HTMLElement>(null);
  const vsRef = useRef<HTMLElement>(null);
  const benefitsRef = useRef<HTMLElement>(null);
  const locationsRef = useRef<HTMLElement>(null);
  const dealsRef = useRef<HTMLElement>(null);
  const saasRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLElement>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 72], ["rgba(6,7,26,0.0)", "rgba(6,7,26,0.94)"]);
  const navBorder = useTransform(scrollY, [0, 72], ["rgba(255,255,255,0.0)", "rgba(255,255,255,0.07)"]);
  const heroParallax = useTransform(scrollY, [0, 700], [0, -140]);

  const floatingY = useMotionValue(0);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const ctrl = animate(floatingY, [0, -18, 0], { duration: 3.5, repeat: Infinity, ease: "easeInOut" });
    return () => ctrl.stop();
  }, [floatingY, prefersReducedMotion]);

  // Lenis smooth scroll
  useEffect(() => {
    if (prefersReducedMotion) return;
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null;
    let rafId: number | null = null;
    import("lenis").then(({ default: Lenis }) => {
      lenis = new Lenis({
        duration: 1.1,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      function raf(time: number) {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);
    });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      lenis?.destroy();
    };
  }, [prefersReducedMotion]);

  useGsapReveal(statsRef, "bottom");
  useGsapReveal(categoriesRef, "bottom");
  useGsapReveal(vsRef, "left");
  useGsapReveal(benefitsRef, "bottom");
  useGsapReveal(locationsRef, "bottom");
  useGsapReveal(dealsRef, "right");
  useGsapReveal(saasRef, "bottom");
  useGsapReveal(testimonialsRef, "bottom");
  useGsapReveal(faqRef, "bottom");
  useGsapReveal(footerRef, "bottom");

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07081f] text-white">
      <NavbarSection navBg={navBg} navBorder={navBorder} />
      <HeroSection heroRef={heroRef} heroParallax={heroParallax} floatingY={floatingY} />
      <OverlapStatsSection statsRef={statsRef} />
      <CarCategoriesSection categoriesRef={categoriesRef} />
      <BudgetVsLuxurySection vsRef={vsRef} />
      <FeaturesSection benefitsRef={benefitsRef} />
      <LocationsSection locationsRef={locationsRef} />
      <DealsCarouselSection dealsRef={dealsRef} prefersReducedMotion={prefersReducedMotion} />
      <StatsCounterSection />
      <SaasTrackingSection saasRef={saasRef} />
      <TestimonialsSection testimonialsRef={testimonialsRef} />
      <FaqSection faqRef={faqRef} />
      <CtaSection />
      <FooterSection footerRef={footerRef} />
    </div>
  );
}
