import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // Only public/marketing routes belong in the sitemap — everything under
  // (dashboard) is authenticated and intentionally excluded.
  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.5 },
  ];
}
