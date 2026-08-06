/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't fail the build on ESLint errors (lint separately in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Don't fail the build on TypeScript errors
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com',  pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.dummyjson.com',    pathname: '/**' },
      { protocol: 'https', hostname: 'i.imgur.com',          pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com',  pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos',        pathname: '/**' },
      { protocol: 'https', hostname: '**.amazonaws.com',     pathname: '/**' },
      { protocol: 'https', hostname: '**.cloudinary.com',    pathname: '/**' },
    ],
    // Allow any domain as fallback (dev only — remove in production)
    dangerouslyAllowSVG: true,
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          }
        ],
      },
    ];
  },
};

export default nextConfig;
