import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const apiInternalUrl = (process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // The Docker build sets SKIP_BUILD_CHECKS=1 to save time and memory; lint/typecheck still run locally and in CI.
  eslint: { ignoreDuringBuilds: process.env.SKIP_BUILD_CHECKS === '1' },
  typescript: { ignoreBuildErrors: process.env.SKIP_BUILD_CHECKS === '1' },
  // Inlined at build time so middleware always has an absolute API URL, even if unset at runtime.
  env: {
    API_INTERNAL_URL: apiInternalUrl,
  },
  // Same-origin API proxy: lets NEXT_PUBLIC_API_URL be "/api" when only the web port is exposed.
  async rewrites() {
    return {
      beforeFiles: [{ source: '/api/:path*', destination: `${apiInternalUrl}/:path*` }],
    };
  },
};

export default withNextIntl(nextConfig);
