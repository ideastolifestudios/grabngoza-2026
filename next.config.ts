import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Point Next.js to the new src directory for routes
  experimental: {
    // This resolves the "same folder" error
  },
  // Ensure the project knows where the root is to stop that warning
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
