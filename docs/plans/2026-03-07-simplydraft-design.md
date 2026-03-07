# SimplyDraft - Design Document

## What
A simple SPA for organizing Magic: The Gathering draft tournaments. No card tracking — purely tournament management: enter players, generate pairings, track scores, show standings.

## Stack
- **SvelteKit** with **Svelte 5** (runes)
- **Tailwind CSS**
- **localStorage** for state persistence
- Deploy on **Vercel**
- No backend, no database, fully client-side

## Flow
1. **Setup** — Choose format (Swiss / Round Robin), enter 4-8 player names
2. **Tournament** — Per round: view pairings, enter scores (best of 3: 2-0, 2-1, 1-2, 0-2)
3. **Standings** — Live standings with match points and tiebreakers

## Swiss Format
- Round count: automatic (4 players = 3 rounds, 5-8 players = 3 rounds)
- Pairings: players with equal/similar standings paired together, no rematches
- Bye: automatically assigned to lowest standing player, counts as 2-0 win, max 1 bye per player per tournament

## Round Robin Format
- Everyone plays everyone
- Odd player count: bye per round (same rules as Swiss)

## Tiebreakers (official MTG)
1. Match Points (3 per win, 1 per draw, 0 per loss)
2. Opponents' Match Win % (OMW%) — minimum 33%
3. Game Win % (GW%)
4. Opponents' Game Win % (OGW%) — minimum 33%

## State Model
```
Tournament {
  format: "swiss" | "round-robin"
  players: Player[]
  rounds: Round[]
  currentRound: number
}

Player { id, name }

Round {
  matches: Match[]
  bye?: playerId
}

Match {
  player1Id, player2Id
  score1, score2  // games won (0-2)
  completed: boolean
}
```

## Views
1. **Setup view** — format selection, player name input
2. **Round view** — pairings + score entry for current round
3. **Standings view** — always accessible

## Persistence
- State saved to localStorage after every action
- On app load: check for active tournament, resume if found
- Option to reset / start new tournament
