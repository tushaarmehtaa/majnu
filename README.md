# Save Majnu Bhai

A dark-comedy execution-themed word guessing game built with Next.js and TypeScript. Help Majnu Bhai escape his fate by guessing words correctly before it's too late!

## v1.1 — Visual and Motion Stability

- Leaderboard data hydrates from local cache + server prefetch for zero flicker and instant tab swaps.
- Responsive rank table/cards with unified motion easing keep the hierarchy readable on desktop and mobile.
- Brand copy, reset timers, and ambient animations make Majnu’s world feel alive.
- Unified loading overlay + skeleton components ensure shimmer appears only on first load.

## Sprint 13 — Launch & Post-Launch Systems

- Sentry wired across frontend + backend with empathetic fatal fallbacks and a `/api/status` health endpoint.
- Production analytics via PostHog capturing `game_start`, `game_win`, `game_loss`, `hint_used`, `share_clicked`, and `leaderboard_viewed` with device/referrer context.
- Installable PWA manifest + offline service worker so the last loaded session runs without a network.
- Auto-pruning leaderboards at 00:00 UTC and follow CTA on the result screen to drive launch retention.

## Sprint 9 — Performance & Stability

- WebP artwork, lazy domain loading, and cached JSON keep loads under 2.5s on 4G.
- Global Zustand store resets audio/confetti reliably and tracks mute state across sessions.
- Offline banner, retry CTA, and funny error boundary keep Majnu from disappearing on network hiccups.
- Leaderboard and hint caches persist locally (w/ console-table analytics) so recent data survives dropouts.
- Fresh skeleton shimmers, 300ms route fades, and new emoji medals make the UI feel finished.

## Features

### Gameplay
- Guess the hidden word before making 5 wrong attempts
- Six different word categories (domains) to choose from
- Hints provided based on the selected domain
- Responsive design with cinematic transitions across screens

### Scoring & Leaderboards
- Base score of 3 points per win
- Streak bonuses from +1 to +5 after 3+ consecutive wins
- Daily and weekly leaderboards
- Personal stats tracking (wins, losses, streaks)

### Social & Delight
- Result screen share button with pre-filled copy and OG previews for wins and losses
- Confetti bursts on victory, red-fade dramatics on defeat
- Sound design with per-event SFX (correct, wrong, win, loss) and a global mute toggle
- Launch analytics instrumented with PostHog (game start/win/loss, hint used, share clicked, leaderboard viewed) and result screen follow CTA

### Hints, Share, Leaderboards
- Deterministic hint generation with caching and domain-based fallbacks so every round surfaces a clue
- Twitter-only share button with randomized copy, UTM-tagged intents, and dynamic OG cards rendered by `/api/og/result`
- Cursor-based daily/weekly leaderboards with paging, live polling, Hot Streak / Comeback badges, and per-minute finish throttling
- Landing hero widget spotlights today’s top three saviors pulled from the leaderboard API

### Data Management
- In-memory storage for development (no setup required)
- Easy integration with InstantDB for production
- Persistent user sessions with secure cookies
- `/api/status` uptime + leaderboard summary endpoint for external monitors

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui + custom motion design
- **Animation**: Framer Motion
- **Audio tooling**: Hand-rolled mp3 generation (Pillow + lameenc) stored in `public/audio`
- **Database**: 
  - Development: In-memory mock
  - Production: [InstantDB](https://instantdb.com/) (optional)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/save-majnu-bhai.git
cd save-majnu-bhai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
Create a `.env.local` file in the root directory with the following variables:

```env
# Database (InstantDB)
INSTANT_APP_ID=your_app_id_here
INSTANT_API_KEY=your_api_key_here

# Build + analytics
NEXT_PUBLIC_APP_VERSION=v1.0.0
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_public_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Observability
SENTRY_DSN=your_server_sentry_dsn
SENTRY_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_DSN=your_browser_sentry_dsn
```

> Leave analytics/observability values blank in development to disable external calls.

## Project Structure

```
majnu/
├── app/                  # Next.js 13+ app directory
│   ├── api/              # API routes
│   ├── play/             # Game page
│   └── leaderboard/      # Leaderboard page
├── components/           # Reusable UI components
├── lib/                  # Utility functions and database logic
├── public/               # Static assets
└── data/                 # Game data and word lists
```

## Monitoring, Analytics & Status

- **Sentry** captures both server (`SENTRY_DSN`) and client (`NEXT_PUBLIC_SENTRY_DSN`) errors with fallback UI (“Oops! Rope snapped.”).
- **PostHog** is initialised through `initAnalytics()` and tracks gameplay funnel metrics with duration, device type, and referrer so counters stay within ±3%.
- **Status endpoint** `GET /api/status` returns `{ status, version, environment, uptime_seconds, leaderboard: { daily, weekly } }` for monitors and smoke checks.

### PWA & Offline

- Manifest served at `/manifest.webmanifest` with maskable + bitmap icons and install shortcuts (`Daily Rope`, `Leaderboard`).
- Service worker `public/sw.js` precaches the app shell, audio, OG art, and offline handoff so a previously loaded session works without network.
- Static fallback lives at `/offline.html`; the worker registers automatically in production builds.

### Incident Playbook

1. Hit `/api/status` and confirm `status: ok`, sane uptime and leaderboard totals.
2. Review Sentry for spikes in `instantdb_*` or `fatal_error` events; breadcrumbs show failing routes.
3. Cross-check PostHog (`game_start` vs `game_win/loss`) to ensure variance <3%.
4. Validate InstantDB credentials (`INSTANT_*`) and redeploy if rotation occurred.
5. If stale assets surface, unregister the service worker and redeploy with an incremented `NEXT_PUBLIC_APP_VERSION`.

👉 For the full regression + launch QA plan see [`docs/launch-readiness.md`](docs/launch-readiness.md).

## Game Rules

1. Select a category to start a new game
2. Guess one letter at a time
3. Each wrong guess brings Majnu Bhai closer to his fate
4. Win by guessing the word before making 5 wrong attempts
5. Build a streak for bonus points!

## Scoring System

- **Win**: +3 points + streak bonus
- **Streak Bonus**: 
  - 3+ wins: +1 to +5 points
  - Resets on loss
- **Loss**: -1 point

## Development

```bash
# Run development server
npm run dev

# Run linter
npm run lint

# Run unit tests
npm run test

# Build for production
npm run build

# Start production server
npm start
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by classic word games with a Bollywood twist
- Built with Next.js and TypeScript
- Special thanks to all contributors

---

Made with ❤️ and a touch of dark humor
