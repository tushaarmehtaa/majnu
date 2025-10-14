import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const highlights = [
  "5 mistakes and Majnu dies.",
  "Bollywood gallows humor. Anonymous play.",
  "Custom topics conjure random death words via GPT-4 mini.",
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-beige text-foreground">
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 py-24">
        <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center opacity-10">
          <Image
            src="/majnu-states/1.png"
            alt="Majnu watermark"
            width={360}
            height={320}
            className="mix-blend-multiply"
            priority
          />
        </div>
        <section className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-10 rounded-3xl bg-beige/95 p-10 shadow-[0_25px_60px_-20px_rgba(192,57,43,0.35)]">
          <header className="flex flex-col items-center gap-4 text-center">
            <Badge className="bg-red/10 text-red">Bollywood Tragicomedy</Badge>
            <h1 className="font-display text-6xl tracking-[0.2em] text-red sm:text-7xl">
              Save Majnu Bhai
            </h1>
            <p className="text-lg font-medium uppercase tracking-[0.3em] text-red">
              Guess the word. Save the man.
            </p>
            <p className="max-w-xl text-balance text-base text-foreground/80">
              Each wrong guess adds one body part. Five mistakes... and Majnu dies.
            </p>
            <p className="animate-pulse text-sm font-semibold uppercase tracking-[0.4em] text-red">
              5 mistakes and Majnu dies.
            </p>
          </header>
          <ul className="grid gap-3 text-sm text-foreground md:grid-cols-3">
            {highlights.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-red/20 bg-white/40 px-4 py-3 text-center font-medium shadow-sm"
              >
                {item}
              </li>
            ))}
          </ul>
          <footer className="flex flex-col items-center justify-between gap-4 text-sm text-foreground/80 md:flex-row">
            <span>Anonymous play powered by InstantDB — no login, no mercy.</span>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="lg" className="bg-red text-beige hover:bg-red/90" asChild>
                <Link href="/play">🔥 Start the Execution</Link>
              </Button>
              <Button variant="outline" className="border-red/40 text-red hover:bg-red/10" asChild>
                <Link href="/leaderboard">🪦 View the Fallen (Coming Soon)</Link>
              </Button>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
