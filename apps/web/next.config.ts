import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@fhusocom/db"],
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
