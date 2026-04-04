"use client";

import dynamic from "next/dynamic";

const CursorGlow = dynamic(() => import("@/components/cursor-glow"), { ssr: false });
const ParticleField = dynamic(() => import("@/components/particle-field"), { ssr: false });

export default function ClientEffects() {
  return (
    <>
      <CursorGlow />
      <ParticleField />
    </>
  );
}
