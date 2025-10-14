# Save Majnu Bhai · Sprint 3

Majnu Bhai’s fate is now scored. Sprint 3 keeps the dark-comedy execution theme, removes AI/custom prompts, and delivers streak-based scoring plus daily and weekly leaderboards on top of the existing gameplay loop.

## Tech Stack
- Next.js 16 (App Router, React 19)
- TypeScript (strict)
- Tailwind CSS + shadcn/ui
- InstantDB (in-memory adapter in this repo) for users, games, stats, and leaderboards

## Getting Started
```
npm install
npm run dev
# quality checks
npm run lint
npm run build
```

### Environment Variables
Anonymous play works out of the box using the mocked InstantDB client. If you wire this to a real InstantDB project, configure `.env.local` with your credentials (no OpenAI key needed—AI support was removed in Sprint 3).

## Domains (Sprint 3)
The six execution domains live in `data/domains.json` with 20 words each:
- fitness – gym and training words
- ai – ML & AI terminology
- cinema – films and set slang
- food – Indian food names
- sports – games and play terms
- books – book structure and publishing terms

## Feature Highlights
- Execution-themed landing page with quick access to `/play` and the new `/leaderboard` route.
- `/play` shows six fixed chips (no custom prompts) and displays the hint badge above the masked word.
- Scoring and streaks:
  - Win: +3 base score, with a +1…+5 streak bonus after the third consecutive win.
  - Loss: –1 and streak reset.
- Leaderboards:
  - Daily (`YYYYMMDD`) and weekly (`YYYYWW`) boards stored separately.
  - Each finish updates leaderboards and `user_stats` in a single routine.
  - `/api/leaderboard?scope=daily|weekly` returns top 100 plus the requester’s rank.
  - `/api/me` exposes aggregate totals and streak information.
- `/leaderboard` UI powered by shadcn Tabs, showing both leaderboards and a personal rank card.
- Result screen now shows the player’s current/best streak chip.

## Acceptance Checklist
- [x] Domain picker exposes exactly six chips.
- [x] New game pulls a random word from the selected domain.
- [x] Wins and losses update streaks, user stats, and both leaderboards.
- [x] Daily tab reflects today’s plays; weekly tab aggregates the ISO week.
- [x] “Your Rank” card appears even when outside the top 100.
- [x] Score calculations follow the base + streak bonus rules.
- [x] Responsive at 360 px with no layout breakage.
- [x] No AI/custom-domain remnants in routes or UI.

## Sprint Notes
- **Sprint 1:** Core hangman gameplay, InstantDB-backed persistence, win/loss routing.
- **Sprint 2:** Added domain picker, hints, and (now-removed) AI custom topics.
- **Sprint 2.5:** Re-skinned into a Bollywood tragicomedy execution theme with new assets and copy.
- **Sprint 3:** Removed AI/custom domains, added scoring + streak bonuses, user stats, and daily/weekly leaderboards.

## Loom / Recording Script (Sprint 3)
1. “Here’s Save Majnu Bhai — five mistakes and the don pulls the lever.”
2. “Tap *Start the Execution*, pick a domain chip like `cinema`, and watch the hint badge appear above the word.”
3. “Play a round, show a win (streak increases) and a loss (streak resets), highlighting the score toast.”
4. “Open the Leaderboard tab to show daily vs. weekly rankings and the personal rank card.”
5. “Refresh mid-game to confirm the state resumes, then finish to update streak chips on the result screen.”
