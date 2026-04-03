import type { NextConfig } from "next";

/**
 * next.config.ts — VaultProxy Production Configuration
 *
 * Key settings:
 * - serverExternalPackages: prevents Next.js from bundling better-sqlite3
 *   (a native Node.js addon that must run as-is, not bundled by webpack)
 * - webpack externals: belt-and-suspenders for the native module
 */
const nextConfig: NextConfig = {
  // Tell Next.js NOT to bundle these server-only native packages.
  // better-sqlite3 uses native C++ bindings (.node files) that cannot
  // be processed by webpack. They must be loaded at runtime from node_modules.
  serverExternalPackages: ["better-sqlite3"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Belt-and-suspenders: also mark as webpack external
      const existing = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [
        ...existing,
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
          if (request === "better-sqlite3" || request?.startsWith("better-sqlite3/")) {
            return callback(null, `commonjs ${request}`);
          }
          callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
