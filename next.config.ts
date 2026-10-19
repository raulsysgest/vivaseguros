import type { NextConfig } from "next";

/** Hostnames LAN (sem porto) para dev via tablet — ver DEV_LAN_HOSTS no .env.local */
const devLanHosts =
  process.env.DEV_LAN_HOSTS?.split(",")
    .map((h) => h.trim())
    .filter(Boolean) ?? [];

const nextConfig: NextConfig = {
  allowedDevOrigins: devLanHosts,
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
