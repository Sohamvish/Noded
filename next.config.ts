import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

loadEnv({ path: path.join(projectRoot, ".env.local") });

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  },
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;