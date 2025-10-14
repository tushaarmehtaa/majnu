import Link from "next/link";
import { Bebas_Neue, Geist, Geist_Mono, Inter, Shrikhand } from "next/font/google";
import "./globals.css";
import type { Metadata } from "next";

import { Toaster } from "@/components/ui/toaster";

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

export const metadata: Metadata = {
  title: "Save Majnu Bhai",
  description:
    "Bollywood gallows humor. Guess the word in five mistakes or Majnu Bhai swings.",
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
        <div className="min-h-screen bg-background text-foreground">
          <header className="sticky top-0 z-40 border-b border-red/20 bg-background/90 backdrop-blur">
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
              </div>
            </nav>
          </header>
          <main>{children}</main>
          <Toaster />
        </div>
      </body>
    </html>
  );
}
