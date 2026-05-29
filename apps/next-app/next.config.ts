import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Transpile le package types partagé du monorepo
  transpilePackages: ['@atline/types'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'payload.atline.online' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },

  // Headers de sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
