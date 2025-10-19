# Save Majnu Bhai

A dark-comedy execution-themed word guessing game built with Next.js and TypeScript. Help Majnu Bhai escape his fate by guessing words correctly before it's too late!

## v1.1 — Visual and Motion Stability

- Leaderboard data hydrates from local cache + server prefetch for zero flicker and instant tab swaps.
- Responsive rank table/cards with unified motion easing keep the hierarchy readable on desktop and mobile.
- Brand copy, reset timers, and ambient animations make Majnu’s world feel alive.
- Unified loading overlay + skeleton components ensure shimmer appears only on first load.

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
- Lightweight analytics logging (`game_start`, `guess_click`, `win`, `loss`, `share_click`, `leaderboard_open`, `error`, `sound_toggle`) output to the console for easy wiring later

### Hints, Share, Leaderboards
- Deterministic hint generation with caching and domain-based fallbacks so every round surfaces a clue
- Twitter-only share button with randomized copy, UTM-tagged intents, and dynamic OG cards rendered by `/api/og/result`
- Cursor-based daily/weekly leaderboards with paging, live polling, Hot Streak / Comeback badges, and per-minute finish throttling
- Landing hero widget spotlights today’s top three saviors pulled from the leaderboard API

### Data Management
- In-memory storage for development (no setup required)
- Easy integration with InstantDB for production
- Persistent user sessions with secure cookies

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
Create a `.env.local` file in the root directory with the following variables if using InstantDB in production:
```env
INSTANT_APP_ID=your_app_id_here
INSTANT_API_KEY=your_api_key_here
```

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
