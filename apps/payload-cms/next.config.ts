import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
  // Allow webpack to resolve .js imports from TypeScript ESM source
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

export default withPayload(nextConfig, {
  devBundleServerPackages: false,
});
