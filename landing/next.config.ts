import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Prevent localhost:3000 in OG meta tags for static export
  env: {},
};

export default nextConfig;
