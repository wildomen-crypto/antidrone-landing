import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: process.env.BUILD_PORTABLE === "true" ? "standalone" : undefined,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
