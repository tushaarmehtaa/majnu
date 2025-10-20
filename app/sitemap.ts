import type { MetadataRoute } from "next";

const siteUrl = "https://savemajnu.live";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = ["/", "/play", "/leaderboard", "/result", "/s"] as const;

  return routes.map((route) => ({
    url: `${siteUrl}${route === "/" ? "" : route}`,
    lastModified: now,
    changeFrequency: route === "/play" || route === "/leaderboard" ? "hourly" : "daily",
    priority: route === "/" ? 1 : route === "/play" ? 0.9 : 0.7,
  }));
}
