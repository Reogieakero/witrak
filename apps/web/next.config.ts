import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fhusocom/db"],
  serverExternalPackages: ["@prisma/client"],
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
