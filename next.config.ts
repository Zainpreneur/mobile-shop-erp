import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "jsonwebtoken"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
