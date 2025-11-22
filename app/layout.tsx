import Link from "next/link";
import { Bebas_Neue, Courier_Prime, Geist, Geist_Mono, Inter, Shrikhand } from "next/font/google";
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

const courier = Courier_Prime({
  variable: "--font-courier",
  weight: "400",
  subsets: ["latin"],
});

const siteUrl = "https://savemajnu.live";
const title = "Save Majnu Bhai — The Bombay Noir Edition";
const description =
  "Bollywood gallows humor tightened for launch. Guess the word in five mistakes or Majnu Bhai swings.";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8B0000" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A1A" },
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
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${bebas.variable} ${shrikhand.variable} ${courier.variable} antialiased`}
      >
        <ClientProviders>
          <div className="relative min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
            {/* Global Texture Overlay */}
            <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: "url(/noise.svg)" }} />
            <div className="pointer-events-none fixed inset-0 z-40 opacity-20 mix-blend-multiply" style={{ backgroundImage: "url(/paper-texture.svg)" }} />

            {/* Vignette */}
            <div className="pointer-events-none fixed inset-0 z-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-sm">
              <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
                <Link href="/" className="font-display text-2xl uppercase tracking-[0.1em] text-primary transition-transform hover:scale-105">
                  Save Majnu Bhai
                </Link>
                <div className="flex items-center gap-6 text-sm font-medium font-mono tracking-tight">
                  <Link href="/play" className="hover:text-primary hover:underline decoration-2 underline-offset-4">
                    PLAY
                  </Link>
                  <Link href="/leaderboard" className="hover:text-primary hover:underline decoration-2 underline-offset-4">
                    WANTED LIST
                  </Link>
                  <SoundToggle />
                </div>
              </nav>
            </header>
            <main className="relative z-10">
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
