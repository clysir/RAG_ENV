import type { NextConfig } from "next";

const backendBaseUrl =
  process.env.BACKEND_API_BASE_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "74.48.5.121",
    "http://74.48.5.121:3000",
  ],

  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
