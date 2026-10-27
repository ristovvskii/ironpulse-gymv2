import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const apiInternalUrl = (process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:4000').replace(/\/+$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // Same-origin API proxy: lets NEXT_PUBLIC_API_URL be "/api" when only the web port is exposed.
  async rewrites() {
    return {
      beforeFiles: [{ source: '/api/:path*', destination: `${apiInternalUrl}/:path*` }],
    };
  },
};

export default withNextIntl(nextConfig);
