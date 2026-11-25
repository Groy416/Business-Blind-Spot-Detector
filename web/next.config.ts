import type { NextConfig } from "next";

// The dashboard is a client-side app: every page fetches from the FastAPI backend in the browser,
// so none of the experimental caching/prefetching modes are needed.
const nextConfig: NextConfig = {
  // Hide the floating "N" development badge so the UI looks like the finished product during demos.
  devIndicators: false,
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
