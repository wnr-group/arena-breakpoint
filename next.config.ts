import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        protocol: 'https',
        hostname: 's40091.pcdn.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        // Local Supabase storage during development
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    qualities: [75, 85],
    // Next 16 blocks optimizing images that resolve to private/loopback IPs (SSRF guard).
    // Local Supabase storage is served from 127.0.0.1, so allow it in development only.
    // Production images come from *.supabase.co (public), so the guard stays on there.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === 'development',
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
