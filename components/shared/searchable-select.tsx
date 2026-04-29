"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Search...",
  className = "",
}: SearchableSelectProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({ top: 0, left: 0, width: 0, maxHeight: 220 });
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRendered(true);
  }, []);

  // Sync query when value changes externally
  useEffect(() => {
    setQuery(value);
    setIsTyping(false);
  }, [value]);

  function updateDropdownPosition() {
    if (!inputRef.current) return;

    const rect = inputRef.current.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportHeight = viewport?.height ?? window.innerHeight;
    const viewportTop = viewport?.offsetTop ?? 0;
    const safePadding = 8;
    const desiredHeight = 260;

    const spaceBelow = viewportTop + viewportHeight - rect.bottom - safePadding;
    const spaceAbove = rect.top - safePadding;
    const shouldOpenUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
    const availableHeight = shouldOpenUpward ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(140, Math.min(desiredHeight, availableHeight));

    setOpenUpward(shouldOpenUpward);
    setDropdownStyle({
      top: shouldOpenUpward ? rect.top - maxHeight - 6 : rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }

  useEffect(() => {
    if (!open) return;
    updateDropdownPosition();

    const handleViewportChange = () => updateDropdownPosition();
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
      window.visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [open, query]);

  // Close on outside click
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as Node;
      const clickedInsideInput = !!containerRef.current?.contains(target);
      const clickedInsideDropdown = !!dropdownRef.current?.contains(target);

      if (!clickedInsideInput && !clickedInsideDropdown) {
        setOpen(false);
        // Reset query to selected value if user abandons search
        setQuery(value);
        setIsTyping(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [value]);

  const filtered = isTyping
    ? options.filter((opt) => opt.toLowerCase().includes(query.toLowerCase()))
    : options;

  function select(opt: string) {
    onChange(opt);
    setQuery(opt);
    setIsTyping(false);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={placeholder}
        onFocus={() => {
          setOpen(true);
          setIsTyping(false);
        }}
        onClick={() => {
          setOpen(true);
          setIsTyping(false);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsTyping(true);
          setOpen(true);
        }}
        className="w-full rounded-md bg-white/5 px-3 py-2 text-[15px] font-semibold leading-6 text-white placeholder-white/30 outline-none"
        autoComplete="off"
      />
      {rendered && open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[1200] overflow-hidden rounded-lg border border-white/10 bg-[#0a0b1e] shadow-xl"
            style={{
              top: dropdownStyle.top,
              left: dropdownStyle.left,
              width: dropdownStyle.width,
            }}
            data-direction={openUpward ? "up" : "down"}
          >
            {filtered.length > 0 ? (
              <ul
                className="overflow-y-auto overscroll-contain touch-pan-y"
                style={{ maxHeight: dropdownStyle.maxHeight }}
              >
                {filtered.map((opt) => (
                  <li
                    key={opt}
                    onMouseDown={() => select(opt)}
                    onClick={() => select(opt)}
                    className={`cursor-pointer px-4 py-2 text-sm text-white hover:bg-cyan-500/20 ${
                      opt === value ? "bg-cyan-500/10 font-semibold text-cyan-300" : ""
                    }`}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-white/40">No cities found</div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
