import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Parent folder has another package-lock.json; without this, Turbopack
  // treats C:\Users\getso as the root and middleware misses .env.local.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
