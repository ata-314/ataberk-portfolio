import type { NextConfig } from "next";

// Public media keep their names between deploys, so browsers revalidated
// every bake, capture and film on each visit (max-age=0). A day fresh, then
// served stale while it revalidates.
const mediaCache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];

const nextConfig: NextConfig = {
  async headers() {
    return ["/models/:path*", "/work/:path*", "/reel/:path*", "/media/:path*"].map((source) => ({ source, headers: mediaCache }));
  },
};

export default nextConfig;
