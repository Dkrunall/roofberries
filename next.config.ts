import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root to this project — otherwise Turbopack can pick
    // up an unrelated package-lock.json from a parent directory.
    root: __dirname,
  },
  experimental: {
    // Turbopack's persistent build cache (.next/cache/turbopack) is on by
    // default as of Next 16.3.0. On Vercel that cache is restored between
    // deployments, and a stale entry produced a "module not found" build
    // failure for a generated next/font/google CSS module. Vercel's own
    // per-deploy build isolation makes the cache-hit speedup marginal here,
    // so it's disabled to avoid that class of failure.
    turbopackFileSystemCacheForBuild: false,
  },
  images: {
    remotePatterns: [
      // Menu item images extracted from the venue's Zillout listing.
      { protocol: 'https', hostname: 'd1hddaam55e99y.cloudfront.net' },
    ],
  },
  async headers() {
    return [
      {
        // public/sw.js (see src/lib/push/subscribeClient.ts) — browsers can
        // cache a service worker script aggressively by default, which
        // would leave customers running a stale worker after a deploy.
        // no-cache forces a revalidation check on every registration.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default nextConfig;
