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
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    // This is required to fix a cross-origin error in the development environment.
    allowedDevOrigins: ['https://*.cloudworkstations.dev'],
  },
  // This is required to prevent the server from restarting in a loop in the development environment.
  watchOptions: {
    ignored: ['**/node_modules'],
  },
};

export default nextConfig;
