import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Page statique de confirmation de réservation (fichier fourni tel quel) servie sur /confirmation
  async rewrites() {
    return [{ source: "/confirmation", destination: "/confirmation.html" }];
  },
};

export default nextConfig;
