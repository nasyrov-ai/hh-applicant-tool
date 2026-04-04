"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

const links = [
  { href: "#features", label: "Возможности" },
  { href: "#dashboard", label: "Дашборд" },
  { href: "#pricing", label: "Тарифы" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 z-40 w-full transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.06] bg-bg-deep/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-gradient-gold text-xl font-extrabold tracking-tight">
            1.618
          </span>
          <span className="text-sm font-semibold text-text-heading">
            WorkSearch
          </span>
        </div>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 sm:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-text-muted transition-colors hover:text-text-heading"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-bg-deep transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_40px_rgba(212,175,55,0.3)]"
          >
            Начать
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-text-heading transition-colors hover:bg-white/[0.06] sm:hidden"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/[0.06] bg-bg-deep/95 px-6 pb-6 pt-4 backdrop-blur-xl sm:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-text-body transition-colors hover:text-text-heading"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#pricing"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3 text-sm font-bold text-bg-deep"
            >
              Начать бесплатно
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
