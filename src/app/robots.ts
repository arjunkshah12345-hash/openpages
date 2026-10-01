import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://openpages.dev";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/onboarding"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
