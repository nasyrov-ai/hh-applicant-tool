"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let x = 0;
    let y = 0;
    let raf = 0;
    let visible = false;

    const update = () => {
      el.style.transform = `translate(${x - 150}px, ${y - 150}px)`;
      if (!visible) {
        el.style.opacity = "1";
        visible = true;
      }
      raf = 0;
    };

    const move = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    };

    const hide = () => {
      el.style.opacity = "0";
      visible = false;
    };

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseleave", hide);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", hide);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="cursor-glow hidden md:block"
      style={{ opacity: 0, left: 0, top: 0 }}
    />
  );
}
