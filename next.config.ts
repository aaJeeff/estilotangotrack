import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow dev access through tunnels (e.g. VS Code devtunnels) in addition to localhost.
  allowedDevOrigins: ["*.devtunnels.ms"],
  experimental: {
    serverActions: {
      // Origins from which Server Actions (forms) may be invoked.
      allowedOrigins: ["localhost:3000", "*.devtunnels.ms"],
    },
  },
};

export default nextConfig;
