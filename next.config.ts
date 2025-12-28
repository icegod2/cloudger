import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // This is required to make sure the binary files are copied to the serverless function
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  serverExternalPackages: [
    '@prisma/client-auth', 
    '@prisma/client-app', 
    'bcryptjs'
  ],
  webpack: (config, { isServer }) => {
    // No longer need manual externals push if using serverExternalPackages
    return config;
  },
};

export default nextConfig;
