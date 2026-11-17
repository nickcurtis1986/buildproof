import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Kept off on purpose: every page reads live data (rankings, counts),
  // so classic dynamic rendering is simpler to reason about.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
