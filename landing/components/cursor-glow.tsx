"use client";

import { useEffect, useRef } from "react";

export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let rafId: number;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
        el.style.opacity = "1";
      });
    };

    const onLeave = () => {
      el.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed z-50 hidden md:block"
      style={{
        width: 300,
        height: 300,
        marginLeft: -150,
        marginTop: -150,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
        mixBlendMode: "screen",
        opacity: 0,
        transition: "opacity 0.3s",
      }}
    />
  );
}
