import type { MetadataRoute } from "next";
import { allModels, sections } from "@/data/catalog";
import { site } from "@/data/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages = [
    { url: "/", priority: 1 },
    { url: "/poslugy", priority: 0.9 },
    ...sections.map((s) => ({ url: s.href, priority: 0.9 })),
    { url: "/poshtoyu", priority: 0.8 },
  ];

  return [
    ...pages.map((p) => ({
      url: `${site.url}${p.url}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: p.priority,
    })),
    ...allModels.map((m) => ({
      url: `${site.url}/modeli/${m.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
