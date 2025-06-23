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
    ],
  },
  watchOptions: {
    ignored: ['**/.genkit/**'],
  },
  allowedDevOrigins: ['https://3000-firebase-studio-1749163371503.cluster-76blnmxvvzdpat4inoxk5tmzik.cloudworkstations.dev'],
};

export default nextConfig;
