import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Habilita <ViewTransition> de React para animar las navegaciones.
    viewTransition: true,
  },
};

export default nextConfig;
