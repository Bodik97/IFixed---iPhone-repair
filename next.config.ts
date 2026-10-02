import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  poweredByHeader: false,

  // Стара адреса кабінету лишилась у закладках і в листах
  async redirects() {
    return [{ source: "/kabinet", destination: "/moi-remonty", permanent: true }];
  },

  // Повного CSP немає навмисно: Clerk вантажить скрипти зі своїх доменів, і
  // сувора політика легко ламає вхід. Лише заборона вбудовувати сайт у фрейм —
  // щоб адмінку не можна було підсунути під чужу сторінку (clickjacking).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
