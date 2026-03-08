import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - eslint config is valid but types might be outdated
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'export',
  images: {
    unoptimized: true
  },
  transpilePackages: ['forgecad'],
  serverExternalPackages: ['manifold-3d'],
  // @ts-ignore - 'turbo' might not be recognized in NextConfig types but it's valid
  experimental: {
    turbo: {
      resolveAlias: {
        module: false,
      },
    },
  },
};

export default nextConfig;
