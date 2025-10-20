import type { MetadataRoute } from "next";

const siteUrl = "https://savemajnu.live";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: siteUrl,
    name: "Save Majnu Bhai",
    short_name: "Majnu",
    description: "Bollywood gallows humor. Guess the word in five mistakes or Majnu Bhai drops.",
    start_url: "/?utm_source=install",
    scope: "/",
    display: "standalone",
    background_color: "#FDF7E4",
    theme_color: "#C0392B",
    lang: "en",
    orientation: "portrait",
    categories: ["games", "entertainment", "puzzle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    screenshots: [
      {
        src: "/og/win.webp",
        sizes: "1200x630",
        type: "image/webp",
        form_factor: "wide",
        label: "Victory screen - Majnu survives",
      },
      {
        src: "/og/loss.webp",
        sizes: "1200x630",
        type: "image/webp",
        form_factor: "wide",
        label: "Loss screen - Rope snapped",
      },
    ],
    shortcuts: [
      {
        name: "Play Daily Rope",
        url: "/play?mode=daily",
        short_name: "Daily Rope",
        description: "Jump straight into the daily execution challenge.",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
      {
        name: "Leaderboard",
        url: "/leaderboard",
        short_name: "Ranks",
        description: "See who saved Majnu Bhai today.",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
        ],
      },
    ],
  };
}
