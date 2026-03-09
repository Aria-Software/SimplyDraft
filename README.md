# SimplyDraft

A simple, client-side Magic: The Gathering draft tournament organizer. No backend, no accounts — just enter players, play rounds, and track standings.

## Features

- **Swiss** and **Round Robin** tournament formats
- **Best of 1** or **Best of 3** match scoring
- **Multi-table support** — run multiple drafts simultaneously
- Official MTG tiebreakers (Match Points → OMW% → GW% → OGW%)
- Automatic bye assignment for odd player counts
- No-rematch Swiss pairings
- localStorage persistence — resume where you left off
- Mobile-friendly responsive UI

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) with [Svelte 5](https://svelte.dev/) (runes)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) for testing
- Deployed on [Vercel](https://vercel.com/)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run check` | Run svelte-check |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## How It Works

1. **Setup** — Pick a format (Swiss / Round Robin), choose best-of mode, enter 4–8 player names
2. **Play rounds** — View pairings, tap a score button (2-0, 2-1, etc.) for each match
3. **Standings** — Live standings with full MTG tiebreaker display
4. **Done** — Tournament completes automatically after the final round

All state is stored in your browser's localStorage. No data leaves your device.

## License

MIT
