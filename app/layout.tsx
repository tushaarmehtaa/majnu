import Link from "next/link";
import { Bebas_Neue, Geist, Geist_Mono, Inter, Shrikhand } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";

import { SoundToggle } from "@/components/sound/sound-toggle";
import { ErrorBoundary } from "@/lib/errorBoundary";
import { RouteTransition } from "@/components/route-transition";
import { ClientProviders } from "@/components/client-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const shrikhand = Shrikhand({
  variable: "--font-shrikhand",
  weight: "400",
  subsets: ["latin"],
});

const siteUrl = "https://savemajnu.live";
const title = "Save Majnu Bhai — Feels Real";
const description =
  "Bollywood gallows humor tightened for launch. Guess the word in five mistakes or Majnu Bhai swings.";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#C0392B" },
    { media: "(prefers-color-scheme: dark)", color: "#C0392B" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | Save Majnu Bhai",
  },
  description,
  applicationName: "Save Majnu Bhai",
  manifest: "/manifest.webmanifest",
  keywords: [
    "hangman",
    "bollywood game",
    "word puzzle",
    "majnu bhai",
    "dark humor",
    "execution game",
  ],
  category: "Games",
  authors: [{ name: "Majnu Launch Crew" }],
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
    },
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: title,
    images: [
      {
        url: `${siteUrl}/og/win.webp`,
        width: 1200,
        height: 630,
        alt: "Majnu Bhai survives the rope.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${siteUrl}/og/win.webp`],
  },
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${bebas.variable} ${shrikhand.variable} antialiased`}
      >
        <ClientProviders>
          <div className="min-h-screen bg-gradient-to-br from-[#FDF7E4] via-[#FFF9E0] to-[#FFF1CC] text-foreground">
            <header className="sticky top-0 z-40 border-b border-red/10 bg-white/70 backdrop-blur">
              <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
                <Link href="/" className="font-display text-2xl uppercase tracking-[0.3em] text-red">
                  Save Majnu Bhai
                </Link>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <Link href="/play" className="hover:text-red">
                    Play
                  </Link>
                  <Link href="/leaderboard" className="hover:text-red">
                    Leaderboard
                  </Link>
                  <SoundToggle />
                </div>
              </nav>
            </header>
            <main>
              <RouteTransition>
                <ErrorBoundary>{children}</ErrorBoundary>
              </RouteTransition>
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
