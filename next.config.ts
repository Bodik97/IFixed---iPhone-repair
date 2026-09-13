import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  // Стара адреса кабінету лишилась у закладках і в листах
  async redirects() {
    return [{ source: "/kabinet", destination: "/moi-remonty", permanent: true }];
  },
};

export default nextConfig;
