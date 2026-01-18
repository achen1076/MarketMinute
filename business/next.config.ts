import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker/serverless
  output: "standalone",
};

export default nextConfig;
