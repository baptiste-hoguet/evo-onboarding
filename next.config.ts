import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Page statique de confirmation de réservation servie sur /confirmation
  async rewrites() {
    return [{ source: "/confirmation", destination: "/confirmation.html" }];
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
