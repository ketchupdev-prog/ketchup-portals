import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      // API versioning compatibility (primary pattern):
      // - Canonical public prefix is /api/v1/*
      // - Existing unversioned handlers under /api/* remain valid
      // - This rewrite keeps backward compatibility while enforcing a single versioning convention
      {
        source: '/api/v1/:path*',
        destination: '/api/:path*',
      },
      
      // Exception: Unversioned operational endpoints can ALSO be accessed with v1 prefix
      // (optional - allows both /api/health AND /api/v1/health to work)
      {
        source: '/api/v1/health/:path*',
        destination: '/api/health/:path*',
      },
      {
        source: '/api/v1/cron/:path*',
        destination: '/api/cron/:path*',
      },
    ];
  },
};

export default nextConfig;
