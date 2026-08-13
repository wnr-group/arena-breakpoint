import type { NextConfig } from "next";

// Local Supabase (NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321) serves uploaded images
// over http from loopback. Dev only — the production optimizer must never be allowed to
// fetch loopback addresses.
const isDev = process.env.NODE_ENV === "development";

const localSupabaseImagePatterns = isDev
  ? [
      {
        protocol: "http" as const,
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "http" as const,
        hostname: "localhost",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
    ]
  : [];

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
      ...localSupabaseImagePatterns,
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Next.js 16 turned `quality` into an allowlist (default [75]); 85 is used by FoodCard.
    qualities: [75, 85],
  },
};

export default nextConfig;
