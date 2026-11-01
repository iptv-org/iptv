import type { NextConfig } from "next";
import * as path from "node:path";

const nextConfig: NextConfig = {
  // The repository root also contains a package-lock.json. Keep Next.js bound to /web.
  turbopack: { root: process.cwd() },
  // Allow reading playlists located in the parent /streams directory.
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
};

export default nextConfig;
