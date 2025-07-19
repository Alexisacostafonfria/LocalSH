
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        // The port can vary, so we can omit it or use a wildcard if needed,
        // but for development, it's usually 3000 or the next available port.
        port: '3000', 
        // Allow images from our new dedicated API route
        pathname: '/api/images/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('mysql2');
    }
    return config;
  },
};

export default nextConfig;
