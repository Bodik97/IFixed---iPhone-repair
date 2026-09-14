import type { MetadataRoute } from "next";
import { allModels, sections } from "@/data/catalog";
import { siteUrl } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const now = new Date();

  const pages = [
    { url: "/", priority: 1 },
    { url: "/poslugy", priority: 0.9 },
    ...sections.map((s) => ({ url: s.href, priority: 0.9 })),
    { url: "/poshtoyu", priority: 0.8 },
  ];

  return [
    ...pages.map((p) => ({
      url: `${base}${p.url}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: p.priority,
    })),
    ...allModels.map((m) => ({
      url: `${base}/modeli/${m.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
