import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // <-- AGREGÁ ESTA LÍNEA
  },
  /* config options here */
};

export default nextConfig;
