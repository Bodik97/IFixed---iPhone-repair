/**
 * Маніфест лише для адмінки: «На головний екран» з адмінки дає окремий
 * застосунок, що відкривається одразу в /admin на весь екран, без рядка браузера.
 *
 * Навмисно не app/manifest.ts — той діяв би на весь сайт, і клієнт, що
 * додав сайт на екран, потрапляв би на вхід в адмінку.
 */
export function GET() {
  return Response.json(
    {
      name: "iFix — адміністрування",
      short_name: "iFix Адмін",
      start_url: "/admin",
      scope: "/admin",
      display: "standalone",
      background_color: "#0B0C0E",
      theme_color: "#0B0C0E",
      icons: [
        { src: "/admin-icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/admin-icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json" } },
  );
}
