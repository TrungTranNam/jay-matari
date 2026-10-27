import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // admin photo uploads go through a server action (lib/images.ts caps files at 20 MB)
  experimental: { serverActions: { bodySizeLimit: '21mb' } },
};

export default nextConfig;
