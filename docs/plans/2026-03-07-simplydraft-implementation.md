# SimplyDraft Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a client-side Magic: The Gathering draft tournament organizer with Swiss and Round Robin formats.

**Architecture:** SvelteKit SPA with all tournament logic in pure TypeScript modules (testable with vitest). State managed with Svelte 5 runes, persisted to localStorage. No backend.

**Tech Stack:** SvelteKit, Svelte 5 (runes), Tailwind CSS, Vitest, Vercel

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `src/app.html`, `src/routes/+page.svelte`, `src/app.css`

**Step 1: Scaffold SvelteKit project**

Run:
```bash
cd /home/ariafarmani/ariasoftware
npx sv create simplydraft --template minimal --types ts
```
Select the minimal template with TypeScript.

**Step 2: Add Tailwind CSS**

Run:
```bash
cd /home/ariafarmani/ariasoftware/simplydraft
npx sv add tailwindcss
```

**Step 3: Install dependencies + vitest**

Run:
```bash
cd /home/ariafarmani/ariasoftware/simplydraft
npm install
npm install -D vitest
```

**Step 4: Configure vitest**

Add to `vite.config.ts`:
```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.test.ts']
	}
});
```

Add to `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Configure SPA mode (no SSR)**

Create `src/routes/+layout.ts`:
```ts
export const ssr = false;
export const prerender = true;
```

**Step 6: Verify dev server starts**

Run: `npm run dev -- --port 5173`
Expected: Server starts on localhost:5173

**Step 7: Initialize git and commit**

```bash
cd /home/ariafarmani/ariasoftware/simplydraft
git init
git add .
git commit -m "chore: scaffold SvelteKit project with Tailwind and vitest"
```

---

### Task 2: Type Definitions

**Files:**
- Create: `src/lib/types.ts`

**Step 1: Define all types**

```ts
export type TournamentFormat = 'swiss' | 'round-robin';

export interface Player {
	id: string;
	name: string;
}

export interface Match {
	player1Id: string;
	player2Id: string;
	score1: number | null; // games won by player1
	score2: number | null; // games won by player2
	completed: boolean;
}

export interface Round {
	matches: Match[];
	byePlayerId?: string;
}

export interface Tournament {
	format: TournamentFormat;
	players: Player[];
	rounds: Round[];
	currentRound: number;
	completed: boolean;
}

export interface Standing {
	player: Player;
	matchPoints: number;
	matchesPlayed: number;
	matchWinPct: number;
	gameWinPct: number;
	omwPct: number;
	ogwPct: number;
}
```

**Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add tournament type definitions"
```

---

### Task 3: Tiebreaker / Standings Calculations

**Files:**
- Create: `src/lib/standings.ts`
- Create: `src/lib/standings.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, test } from 'vitest';
import { calculateStandings } from './standings';
import type { Tournament } from './types';

function makeTournament(overrides: Partial<Tournament> = {}): Tournament {
	return {
		format: 'swiss',
		players: [
			{ id: '1', name: 'Alice' },
			{ id: '2', name: 'Bob' },
			{ id: '3', name: 'Charlie' },
			{ id: '4', name: 'Diana' }
		],
		rounds: [],
		currentRound: 0,
		completed: false,
		...overrides
	};
}

describe('calculateStandings', () => {
	test('all players start at 0 points with no rounds', () => {
		const t = makeTournament();
		const standings = calculateStandings(t);
		expect(standings).toHaveLength(4);
		expect(standings[0].matchPoints).toBe(0);
	});

	test('winner gets 3 match points', () => {
		const t = makeTournament({
			rounds: [{
				matches: [
					{ player1Id: '1', player2Id: '2', score1: 2, score2: 0, completed: true },
					{ player1Id: '3', player2Id: '4', score1: 2, score2: 1, completed: true }
				]
			}],
			currentRound: 1
		});
		const standings = calculateStandings(t);
		const alice = standings.find(s => s.player.id === '1')!;
		const bob = standings.find(s => s.player.id === '2')!;
		expect(alice.matchPoints).toBe(3);
		expect(bob.matchPoints).toBe(0);
	});

	test('match win percentage has 33% floor', () => {
		const t = makeTournament({
			rounds: [{
				matches: [
					{ player1Id: '1', player2Id: '2', score1: 2, score2: 0, completed: true },
					{ player1Id: '3', player2Id: '4', score1: 2, score2: 0, completed: true }
				]
			}],
			currentRound: 1
		});
		const standings = calculateStandings(t);
		const bob = standings.find(s => s.player.id === '2')!;
		// Bob lost 0-2, raw MWP = 0, but floor is 0.33
		expect(bob.matchWinPct).toBeCloseTo(0.33, 2);
	});

	test('bye counts as 2-0 win', () => {
		const t = makeTournament({
			players: [
				{ id: '1', name: 'Alice' },
				{ id: '2', name: 'Bob' },
				{ id: '3', name: 'Charlie' }
			],
			rounds: [{
				matches: [
					{ player1Id: '1', player2Id: '2', score1: 2, score2: 1, completed: true }
				],
				byePlayerId: '3'
			}],
			currentRound: 1
		});
		const standings = calculateStandings(t);
		const charlie = standings.find(s => s.player.id === '3')!;
		expect(charlie.matchPoints).toBe(3);
	});

	test('standings are sorted by match points, then OMW%, then GW%, then OGW%', () => {
		const t = makeTournament({
			rounds: [
				{
					matches: [
						{ player1Id: '1', player2Id: '2', score1: 2, score2: 0, completed: true },
						{ player1Id: '3', player2Id: '4', score1: 2, score2: 1, completed: true }
					]
				},
				{
					matches: [
						{ player1Id: '1', player2Id: '3', score1: 2, score2: 0, completed: true },
						{ player1Id: '2', player2Id: '4', score1: 2, score2: 0, completed: true }
					]
				}
			],
			currentRound: 2
		});
		const standings = calculateStandings(t);
		// Alice: 2 wins (6 pts), Charlie: 1 win (3 pts), Bob: 1 win (3 pts), Diana: 0 wins (0 pts)
		expect(standings[0].player.name).toBe('Alice');
		expect(standings[0].matchPoints).toBe(6);
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/standings.test.ts`
Expected: FAIL — module not found

**Step 3: Implement standings calculation**

```ts
import type { Tournament, Standing, Player } from './types';

export function calculateStandings(tournament: Tournament): Standing[] {
	const { players, rounds } = tournament;

	const playerMatchPoints = new Map<string, number>();
	const playerMatchesPlayed = new Map<string, number>();
	const playerGamesWon = new Map<string, number>();
	const playerGamesPlayed = new Map<string, number>();
	const playerOpponents = new Map<string, string[]>();

	for (const p of players) {
		playerMatchPoints.set(p.id, 0);
		playerMatchesPlayed.set(p.id, 0);
		playerGamesWon.set(p.id, 0);
		playerGamesPlayed.set(p.id, 0);
		playerOpponents.set(p.id, []);
	}

	for (const round of rounds) {
		for (const match of round.matches) {
			if (!match.completed) continue;
			const { player1Id, player2Id, score1, score2 } = match;
			if (score1 === null || score2 === null) continue;

			playerMatchesPlayed.set(player1Id, (playerMatchesPlayed.get(player1Id) ?? 0) + 1);
			playerMatchesPlayed.set(player2Id, (playerMatchesPlayed.get(player2Id) ?? 0) + 1);

			playerGamesWon.set(player1Id, (playerGamesWon.get(player1Id) ?? 0) + score1);
			playerGamesWon.set(player2Id, (playerGamesWon.get(player2Id) ?? 0) + score2);
			playerGamesPlayed.set(player1Id, (playerGamesPlayed.get(player1Id) ?? 0) + score1 + score2);
			playerGamesPlayed.set(player2Id, (playerGamesPlayed.get(player2Id) ?? 0) + score1 + score2);

			playerOpponents.get(player1Id)!.push(player2Id);
			playerOpponents.get(player2Id)!.push(player1Id);

			if (score1 > score2) {
				playerMatchPoints.set(player1Id, (playerMatchPoints.get(player1Id) ?? 0) + 3);
			} else if (score2 > score1) {
				playerMatchPoints.set(player2Id, (playerMatchPoints.get(player2Id) ?? 0) + 3);
			} else {
				playerMatchPoints.set(player1Id, (playerMatchPoints.get(player1Id) ?? 0) + 1);
				playerMatchPoints.set(player2Id, (playerMatchPoints.get(player2Id) ?? 0) + 1);
			}
		}

		// Bye counts as 2-0 win
		if (round.byePlayerId) {
			const byeId = round.byePlayerId;
			playerMatchPoints.set(byeId, (playerMatchPoints.get(byeId) ?? 0) + 3);
			playerMatchesPlayed.set(byeId, (playerMatchesPlayed.get(byeId) ?? 0) + 1);
			playerGamesWon.set(byeId, (playerGamesWon.get(byeId) ?? 0) + 2);
			playerGamesPlayed.set(byeId, (playerGamesPlayed.get(byeId) ?? 0) + 2);
		}
	}

	function matchWinPct(playerId: string): number {
		const played = playerMatchesPlayed.get(playerId) ?? 0;
		if (played === 0) return 0.33;
		const raw = (playerMatchPoints.get(playerId) ?? 0) / (played * 3);
		return Math.max(raw, 0.33);
	}

	function gameWinPct(playerId: string): number {
		const played = playerGamesPlayed.get(playerId) ?? 0;
		if (played === 0) return 0.33;
		const raw = (playerGamesWon.get(playerId) ?? 0) / played;
		return Math.max(raw, 0.33);
	}

	function omwPct(playerId: string): number {
		const opps = playerOpponents.get(playerId) ?? [];
		if (opps.length === 0) return 0.33;
		const sum = opps.reduce((acc, oppId) => acc + matchWinPct(oppId), 0);
		return sum / opps.length;
	}

	function ogwPct(playerId: string): number {
		const opps = playerOpponents.get(playerId) ?? [];
		if (opps.length === 0) return 0.33;
		const sum = opps.reduce((acc, oppId) => acc + gameWinPct(oppId), 0);
		return sum / opps.length;
	}

	const standings: Standing[] = players.map(player => ({
		player,
		matchPoints: playerMatchPoints.get(player.id) ?? 0,
		matchesPlayed: playerMatchesPlayed.get(player.id) ?? 0,
		matchWinPct: matchWinPct(player.id),
		gameWinPct: gameWinPct(player.id),
		omwPct: omwPct(player.id),
		ogwPct: ogwPct(player.id)
	}));

	standings.sort((a, b) => {
		if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
		if (b.omwPct !== a.omwPct) return b.omwPct - a.omwPct;
		if (b.gameWinPct !== a.gameWinPct) return b.gameWinPct - a.gameWinPct;
		return b.ogwPct - a.ogwPct;
	});

	return standings;
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/standings.test.ts`
Expected: All 5 tests PASS

**Step 5: Commit**

```bash
git add src/lib/standings.ts src/lib/standings.test.ts
git commit -m "feat: implement standings calculation with MTG tiebreakers"
```

---

### Task 4: Swiss Pairing Algorithm

**Files:**
- Create: `src/lib/pairings.ts`
- Create: `src/lib/pairings.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, test } from 'vitest';
import { generateSwissPairings, getSwissRoundCount } from './pairings';
import type { Tournament } from './types';

function makePlayers(count: number) {
	return Array.from({ length: count }, (_, i) => ({ id: String(i + 1), name: `Player ${i + 1}` }));
}

describe('getSwissRoundCount', () => {
	test('4 players = 3 rounds', () => {
		expect(getSwissRoundCount(4)).toBe(3);
	});
	test('5-8 players = 3 rounds', () => {
		expect(getSwissRoundCount(5)).toBe(3);
		expect(getSwissRoundCount(8)).toBe(3);
	});
});

describe('generateSwissPairings', () => {
	test('4 players round 1: 2 matches, no bye', () => {
		const t: Tournament = {
			format: 'swiss',
			players: makePlayers(4),
			rounds: [],
			currentRound: 0,
			completed: false
		};
		const round = generateSwissPairings(t);
		expect(round.matches).toHaveLength(2);
		expect(round.byePlayerId).toBeUndefined();
	});

	test('5 players: 2 matches + 1 bye', () => {
		const t: Tournament = {
			format: 'swiss',
			players: makePlayers(5),
			rounds: [],
			currentRound: 0,
			completed: false
		};
		const round = generateSwissPairings(t);
		expect(round.matches).toHaveLength(2);
		expect(round.byePlayerId).toBeDefined();
	});

	test('bye goes to lowest standing player', () => {
		const t: Tournament = {
			format: 'swiss',
			players: makePlayers(5),
			rounds: [{
				matches: [
					{ player1Id: '1', player2Id: '2', score1: 2, score2: 0, completed: true },
					{ player1Id: '3', player2Id: '4', score1: 2, score2: 1, completed: true }
				],
				byePlayerId: '5'
			}],
			currentRound: 1,
			completed: false
		};
		const round = generateSwissPairings(t);
		// Player 5 already had bye, so next lowest gets it
		// Players 2 and 4 lost. One of them should get the bye (not 5 again)
		expect(round.byePlayerId).not.toBe('5');
	});

	test('no rematches when possible', () => {
		const t: Tournament = {
			format: 'swiss',
			players: makePlayers(4),
			rounds: [{
				matches: [
					{ player1Id: '1', player2Id: '2', score1: 2, score2: 0, completed: true },
					{ player1Id: '3', player2Id: '4', score1: 2, score2: 1, completed: true }
				]
			}],
			currentRound: 1,
			completed: false
		};
		const round = generateSwissPairings(t);
		const pairSet = round.matches.map(m => [m.player1Id, m.player2Id].sort().join('-'));
		// Should not repeat round 1 pairings
		expect(pairSet).not.toContain('1-2');
		expect(pairSet).not.toContain('3-4');
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/pairings.test.ts`
Expected: FAIL

**Step 3: Implement Swiss pairings**

```ts
import { calculateStandings } from './standings';
import type { Tournament, Round, Match } from './types';

export function getSwissRoundCount(playerCount: number): number {
	if (playerCount <= 8) return 3;
	return Math.ceil(Math.log2(playerCount));
}

export function generateSwissPairings(tournament: Tournament): Round {
	const standings = calculateStandings(tournament);
	const previousPairings = getPreviousPairings(tournament);
	const previousByes = getPreviousByes(tournament);

	let byePlayerId: string | undefined;
	let activePlayers = standings.map(s => s.player.id);

	// Odd number of players: assign bye
	if (activePlayers.length % 2 !== 0) {
		// Find lowest standing player who hasn't had a bye
		for (let i = activePlayers.length - 1; i >= 0; i--) {
			if (!previousByes.has(activePlayers[i])) {
				byePlayerId = activePlayers[i];
				activePlayers = activePlayers.filter(id => id !== byePlayerId);
				break;
			}
		}
		// If everyone already had a bye, give it to the lowest standing
		if (!byePlayerId) {
			byePlayerId = activePlayers[activePlayers.length - 1];
			activePlayers = activePlayers.slice(0, -1);
		}
	}

	const matches = pairPlayers(activePlayers, previousPairings);

	return { matches, byePlayerId };
}

function pairPlayers(playerIds: string[], previousPairings: Set<string>): Match[] {
	const matches: Match[] = [];
	const paired = new Set<string>();

	for (let i = 0; i < playerIds.length; i++) {
		if (paired.has(playerIds[i])) continue;

		for (let j = i + 1; j < playerIds.length; j++) {
			if (paired.has(playerIds[j])) continue;

			const pairKey = [playerIds[i], playerIds[j]].sort().join('-');
			if (!previousPairings.has(pairKey)) {
				matches.push({
					player1Id: playerIds[i],
					player2Id: playerIds[j],
					score1: null,
					score2: null,
					completed: false
				});
				paired.add(playerIds[i]);
				paired.add(playerIds[j]);
				break;
			}
		}
	}

	// Fallback: pair remaining players even if rematch
	for (let i = 0; i < playerIds.length; i++) {
		if (paired.has(playerIds[i])) continue;
		for (let j = i + 1; j < playerIds.length; j++) {
			if (paired.has(playerIds[j])) continue;
			matches.push({
				player1Id: playerIds[i],
				player2Id: playerIds[j],
				score1: null,
				score2: null,
				completed: false
			});
			paired.add(playerIds[i]);
			paired.add(playerIds[j]);
			break;
		}
	}

	return matches;
}

function getPreviousPairings(tournament: Tournament): Set<string> {
	const pairings = new Set<string>();
	for (const round of tournament.rounds) {
		for (const match of round.matches) {
			const key = [match.player1Id, match.player2Id].sort().join('-');
			pairings.add(key);
		}
	}
	return pairings;
}

function getPreviousByes(tournament: Tournament): Set<string> {
	const byes = new Set<string>();
	for (const round of tournament.rounds) {
		if (round.byePlayerId) byes.add(round.byePlayerId);
	}
	return byes;
}
```

**Step 4: Run tests**

Run: `npx vitest run src/lib/pairings.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/lib/pairings.ts src/lib/pairings.test.ts
git commit -m "feat: implement Swiss pairing algorithm with bye assignment"
```

---

### Task 5: Round Robin Schedule Generator

**Files:**
- Create: `src/lib/round-robin.ts`
- Create: `src/lib/round-robin.test.ts`

**Step 1: Write failing tests**

```ts
import { describe, expect, test } from 'vitest';
import { generateRoundRobinSchedule, getRoundRobinRoundCount } from './round-robin';

function makePlayers(count: number) {
	return Array.from({ length: count }, (_, i) => ({ id: String(i + 1), name: `Player ${i + 1}` }));
}

describe('getRoundRobinRoundCount', () => {
	test('4 players = 3 rounds', () => {
		expect(getRoundRobinRoundCount(4)).toBe(3);
	});
	test('5 players = 5 rounds', () => {
		expect(getRoundRobinRoundCount(5)).toBe(5);
	});
	test('6 players = 5 rounds', () => {
		expect(getRoundRobinRoundCount(6)).toBe(5);
	});
});

describe('generateRoundRobinSchedule', () => {
	test('4 players: everyone plays everyone exactly once across all rounds', () => {
		const players = makePlayers(4);
		const rounds = generateRoundRobinSchedule(players);
		const allPairs = new Set<string>();
		for (const round of rounds) {
			for (const match of round.matches) {
				const key = [match.player1Id, match.player2Id].sort().join('-');
				expect(allPairs.has(key)).toBe(false); // no duplicate matchups
				allPairs.add(key);
			}
		}
		// 4 choose 2 = 6 total matchups
		expect(allPairs.size).toBe(6);
	});

	test('5 players: each round has a bye', () => {
		const players = makePlayers(5);
		const rounds = generateRoundRobinSchedule(players);
		for (const round of rounds) {
			expect(round.byePlayerId).toBeDefined();
			expect(round.matches).toHaveLength(2);
		}
	});
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/round-robin.test.ts`
Expected: FAIL

**Step 3: Implement Round Robin schedule**

Uses the circle method (standard round-robin tournament algorithm):

```ts
import type { Player, Round, Match } from './types';

export function getRoundRobinRoundCount(playerCount: number): number {
	// If odd, each player sits out once per cycle
	return playerCount % 2 === 0 ? playerCount - 1 : playerCount;
}

export function generateRoundRobinSchedule(players: Player[]): Round[] {
	const ids = players.map(p => p.id);
	const n = ids.length;
	const isOdd = n % 2 !== 0;

	// Circle method: add a dummy "BYE" slot if odd
	const slots = isOdd ? [...ids, 'BYE'] : [...ids];
	const numRounds = slots.length - 1;
	const rounds: Round[] = [];

	for (let r = 0; r < numRounds; r++) {
		const matches: Match[] = [];
		let byePlayerId: string | undefined;

		for (let i = 0; i < slots.length / 2; i++) {
			const home = slots[i];
			const away = slots[slots.length - 1 - i];

			if (home === 'BYE') {
				byePlayerId = away;
			} else if (away === 'BYE') {
				byePlayerId = home;
			} else {
				matches.push({
					player1Id: home,
					player2Id: away,
					score1: null,
					score2: null,
					completed: false
				});
			}
		}

		rounds.push({ matches, byePlayerId });

		// Rotate: fix first element, rotate the rest
		const fixed = slots[0];
		const last = slots.pop()!;
		slots.splice(1, 0, last);
		slots[0] = fixed;
	}

	return rounds;
}
```

**Step 4: Run tests**

Run: `npx vitest run src/lib/round-robin.test.ts`
Expected: All PASS

**Step 5: Commit**

```bash
git add src/lib/round-robin.ts src/lib/round-robin.test.ts
git commit -m "feat: implement round-robin schedule generation"
```

---

### Task 6: Tournament State Manager

**Files:**
- Create: `src/lib/tournament.svelte.ts`
- Create: `src/lib/storage.ts`

**Step 1: Create localStorage helper**

`src/lib/storage.ts`:
```ts
import type { Tournament } from './types';

const STORAGE_KEY = 'simplydraft-tournament';

export function saveTournament(tournament: Tournament): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament));
}

export function loadTournament(): Tournament | null {
	const data = localStorage.getItem(STORAGE_KEY);
	if (!data) return null;
	try {
		return JSON.parse(data) as Tournament;
	} catch {
		return null;
	}
}

export function clearTournament(): void {
	localStorage.removeItem(STORAGE_KEY);
}
```

**Step 2: Create tournament state with Svelte 5 runes**

`src/lib/tournament.svelte.ts`:
```ts
import type { Tournament, TournamentFormat, Player, Match } from './types';
import { generateSwissPairings, getSwissRoundCount } from './pairings';
import { generateRoundRobinSchedule, getRoundRobinRoundCount } from './round-robin';
import { calculateStandings } from './standings';
import { saveTournament, loadTournament, clearTournament } from './storage';

function createId(): string {
	return Math.random().toString(36).substring(2, 9);
}

export function createTournamentState() {
	let tournament = $state<Tournament | null>(null);

	const standings = $derived(tournament ? calculateStandings(tournament) : []);

	const totalRounds = $derived(() => {
		if (!tournament) return 0;
		if (tournament.format === 'round-robin') return getRoundRobinRoundCount(tournament.players.length);
		return getSwissRoundCount(tournament.players.length);
	});

	const currentRoundData = $derived(
		tournament && tournament.currentRound > 0
			? tournament.rounds[tournament.currentRound - 1]
			: null
	);

	const allMatchesComplete = $derived(
		currentRoundData ? currentRoundData.matches.every(m => m.completed) : false
	);

	function init() {
		const saved = loadTournament();
		if (saved) tournament = saved;
	}

	function persist() {
		if (tournament) saveTournament(tournament);
	}

	function startTournament(format: TournamentFormat, playerNames: string[]) {
		const players: Player[] = playerNames.map(name => ({ id: createId(), name }));

		if (format === 'round-robin') {
			const allRounds = generateRoundRobinSchedule(players);
			tournament = {
				format,
				players,
				rounds: allRounds,
				currentRound: 1,
				completed: false
			};
		} else {
			const firstRound = generateSwissPairings({
				format,
				players,
				rounds: [],
				currentRound: 0,
				completed: false
			});
			tournament = {
				format,
				players,
				rounds: [firstRound],
				currentRound: 1,
				completed: false
			};
		}
		persist();
	}

	function submitScore(matchIndex: number, score1: number, score2: number) {
		if (!tournament || !currentRoundData) return;
		const match = currentRoundData.matches[matchIndex];
		match.score1 = score1;
		match.score2 = score2;
		match.completed = true;
		persist();
	}

	function nextRound() {
		if (!tournament) return;

		const maxRounds = tournament.format === 'round-robin'
			? getRoundRobinRoundCount(tournament.players.length)
			: getSwissRoundCount(tournament.players.length);

		if (tournament.currentRound >= maxRounds) {
			tournament.completed = true;
			persist();
			return;
		}

		if (tournament.format === 'swiss') {
			const newRound = generateSwissPairings(tournament);
			tournament.rounds.push(newRound);
		}

		tournament.currentRound++;
		persist();
	}

	function reset() {
		tournament = null;
		clearTournament();
	}

	return {
		get tournament() { return tournament; },
		get standings() { return standings; },
		get totalRounds() { return totalRounds; },
		get currentRoundData() { return currentRoundData; },
		get allMatchesComplete() { return allMatchesComplete; },
		init,
		startTournament,
		submitScore,
		nextRound,
		reset
	};
}
```

**Step 3: Commit**

```bash
git add src/lib/storage.ts src/lib/tournament.svelte.ts
git commit -m "feat: add tournament state manager with localStorage persistence"
```

---

### Task 7: Setup View

**Files:**
- Create: `src/lib/components/SetupView.svelte`
- Modify: `src/routes/+page.svelte`

**Step 1: Create SetupView component**

`src/lib/components/SetupView.svelte`:
```svelte
<script lang="ts">
	import type { TournamentFormat } from '$lib/types';

	interface Props {
		onStart: (format: TournamentFormat, players: string[]) => void;
	}

	let { onStart }: Props = $props();

	let format = $state<TournamentFormat>('swiss');
	let playerCount = $state(4);
	let playerNames = $state<string[]>(Array(8).fill(''));

	let validPlayers = $derived(
		playerNames.slice(0, playerCount).filter(n => n.trim().length > 0)
	);
	let canStart = $derived(validPlayers.length === playerCount);

	function handleStart() {
		if (!canStart) return;
		onStart(format, validPlayers);
	}
</script>

<div class="max-w-lg mx-auto space-y-6">
	<h1 class="text-3xl font-bold text-center">SimplyDraft</h1>
	<p class="text-center text-gray-500">Magic: The Gathering Tournament Organizer</p>

	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium mb-2">Format</label>
			<div class="flex gap-2">
				<button
					class="flex-1 py-2 px-4 rounded-lg border-2 transition-colors {format === 'swiss' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}"
					onclick={() => format = 'swiss'}
				>Swiss</button>
				<button
					class="flex-1 py-2 px-4 rounded-lg border-2 transition-colors {format === 'round-robin' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}"
					onclick={() => format = 'round-robin'}
				>Round Robin</button>
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2">Players</label>
			<div class="flex gap-2">
				{#each [4, 5, 6, 7, 8] as count}
					<button
						class="flex-1 py-2 px-3 rounded-lg border-2 transition-colors {playerCount === count ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}"
						onclick={() => playerCount = count}
					>{count}</button>
				{/each}
			</div>
		</div>

		<div class="space-y-2">
			{#each { length: playerCount } as _, i}
				<input
					type="text"
					placeholder="Player {i + 1}"
					bind:value={playerNames[i]}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			{/each}
		</div>

		<button
			onclick={handleStart}
			disabled={!canStart}
			class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>Start Tournament</button>
	</div>
</div>
```

**Step 2: Commit**

```bash
git add src/lib/components/SetupView.svelte
git commit -m "feat: add setup view component"
```

---

### Task 8: Round View

**Files:**
- Create: `src/lib/components/RoundView.svelte`
- Create: `src/lib/components/MatchCard.svelte`

**Step 1: Create MatchCard component**

`src/lib/components/MatchCard.svelte`:
```svelte
<script lang="ts">
	import type { Match, Player } from '$lib/types';

	interface Props {
		match: Match;
		players: Player[];
		matchIndex: number;
		onSubmitScore: (matchIndex: number, score1: number, score2: number) => void;
	}

	let { match, players, matchIndex, onSubmitScore }: Props = $props();

	let player1 = $derived(players.find(p => p.id === match.player1Id)!);
	let player2 = $derived(players.find(p => p.id === match.player2Id)!);

	const scoreOptions: [number, number][] = [[2, 0], [2, 1], [1, 2], [0, 2]];
</script>

<div class="border border-gray-200 rounded-lg p-4">
	<div class="flex items-center justify-between mb-3">
		<span class="font-medium">{player1.name}</span>
		<span class="text-gray-400">vs</span>
		<span class="font-medium">{player2.name}</span>
	</div>

	{#if match.completed}
		<div class="text-center text-lg font-bold text-green-600">
			{match.score1} - {match.score2}
		</div>
	{:else}
		<div class="flex gap-2 justify-center">
			{#each scoreOptions as [s1, s2]}
				<button
					onclick={() => onSubmitScore(matchIndex, s1, s2)}
					class="px-3 py-1 border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
				>{s1}-{s2}</button>
			{/each}
		</div>
	{/if}
</div>
```

**Step 2: Create RoundView component**

`src/lib/components/RoundView.svelte`:
```svelte
<script lang="ts">
	import type { Round, Player } from '$lib/types';
	import MatchCard from './MatchCard.svelte';

	interface Props {
		round: Round;
		roundNumber: number;
		totalRounds: number;
		players: Player[];
		allMatchesComplete: boolean;
		onSubmitScore: (matchIndex: number, score1: number, score2: number) => void;
		onNextRound: () => void;
		tournamentCompleted: boolean;
	}

	let { round, roundNumber, totalRounds, players, allMatchesComplete, onSubmitScore, onNextRound, tournamentCompleted }: Props = $props();

	let byePlayer = $derived(
		round.byePlayerId ? players.find(p => p.id === round.byePlayerId) : null
	);
</script>

<div class="space-y-4">
	<h2 class="text-xl font-bold text-center">Round {roundNumber} / {totalRounds}</h2>

	{#if byePlayer}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center text-sm">
			<span class="font-medium">{byePlayer.name}</span> has a bye (2-0 win)
		</div>
	{/if}

	<div class="space-y-3">
		{#each round.matches as match, i}
			<MatchCard {match} {players} matchIndex={i} {onSubmitScore} />
		{/each}
	</div>

	{#if allMatchesComplete && !tournamentCompleted}
		<button
			onclick={onNextRound}
			class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
		>
			{roundNumber >= totalRounds ? 'Finish Tournament' : 'Next Round'}
		</button>
	{/if}
</div>
```

**Step 3: Commit**

```bash
git add src/lib/components/MatchCard.svelte src/lib/components/RoundView.svelte
git commit -m "feat: add round view with match score entry"
```

---

### Task 9: Standings View

**Files:**
- Create: `src/lib/components/StandingsView.svelte`

**Step 1: Create StandingsView component**

`src/lib/components/StandingsView.svelte`:
```svelte
<script lang="ts">
	import type { Standing } from '$lib/types';

	interface Props {
		standings: Standing[];
		tournamentCompleted: boolean;
	}

	let { standings, tournamentCompleted }: Props = $props();

	function pct(value: number): string {
		return (value * 100).toFixed(1) + '%';
	}
</script>

<div class="space-y-4">
	<h2 class="text-xl font-bold text-center">
		{tournamentCompleted ? 'Final Standings' : 'Standings'}
	</h2>

	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-gray-300">
					<th class="text-left py-2 px-2">#</th>
					<th class="text-left py-2 px-2">Player</th>
					<th class="text-center py-2 px-2">Pts</th>
					<th class="text-center py-2 px-2">OMW%</th>
					<th class="text-center py-2 px-2">GW%</th>
					<th class="text-center py-2 px-2">OGW%</th>
				</tr>
			</thead>
			<tbody>
				{#each standings as standing, i}
					<tr class="border-b border-gray-100 {i === 0 && tournamentCompleted ? 'bg-yellow-50 font-bold' : ''}">
						<td class="py-2 px-2">{i + 1}</td>
						<td class="py-2 px-2">{standing.player.name}</td>
						<td class="text-center py-2 px-2">{standing.matchPoints}</td>
						<td class="text-center py-2 px-2">{pct(standing.omwPct)}</td>
						<td class="text-center py-2 px-2">{pct(standing.gameWinPct)}</td>
						<td class="text-center py-2 px-2">{pct(standing.ogwPct)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
```

**Step 2: Commit**

```bash
git add src/lib/components/StandingsView.svelte
git commit -m "feat: add standings view with tiebreaker display"
```

---

### Task 10: Wire Up Main Page

**Files:**
- Modify: `src/routes/+page.svelte`

**Step 1: Create main page that ties everything together**

`src/routes/+page.svelte`:
```svelte
<script lang="ts">
	import { onMount } from 'svelte';
	import { createTournamentState } from '$lib/tournament.svelte';
	import SetupView from '$lib/components/SetupView.svelte';
	import RoundView from '$lib/components/RoundView.svelte';
	import StandingsView from '$lib/components/StandingsView.svelte';

	const state = createTournamentState();

	let activeTab = $state<'round' | 'standings'>('round');

	onMount(() => {
		state.init();
	});
</script>

<svelte:head>
	<title>SimplyDraft</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<div class="max-w-2xl mx-auto px-4 py-8">
		{#if !state.tournament}
			<SetupView onStart={state.startTournament} />
		{:else}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h1 class="text-2xl font-bold">SimplyDraft</h1>
					<button
						onclick={() => { if (confirm('Start a new tournament?')) state.reset(); }}
						class="text-sm text-red-500 hover:text-red-700"
					>New Tournament</button>
				</div>

				<div class="flex gap-2 border-b border-gray-200">
					<button
						class="py-2 px-4 -mb-px transition-colors {activeTab === 'round' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
						onclick={() => activeTab = 'round'}
					>Rounds</button>
					<button
						class="py-2 px-4 -mb-px transition-colors {activeTab === 'standings' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
						onclick={() => activeTab = 'standings'}
					>Standings</button>
				</div>

				{#if activeTab === 'round' && state.currentRoundData}
					<RoundView
						round={state.currentRoundData}
						roundNumber={state.tournament.currentRound}
						totalRounds={state.totalRounds}
						players={state.tournament.players}
						allMatchesComplete={state.allMatchesComplete}
						onSubmitScore={state.submitScore}
						onNextRound={state.nextRound}
						tournamentCompleted={state.tournament.completed}
					/>
				{/if}

				{#if activeTab === 'standings'}
					<StandingsView
						standings={state.standings}
						tournamentCompleted={state.tournament.completed}
					/>
				{/if}

				{#if state.tournament.completed}
					<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
						<p class="text-green-800 font-bold text-lg">Tournament Complete!</p>
						<p class="text-green-600">Winner: {state.standings[0]?.player.name}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
```

**Step 2: Verify the app runs**

Run: `npm run dev -- --port 5173`
Open browser, test full flow: setup → pairings → scores → standings

**Step 3: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: wire up main page with all views"
```

---

### Task 11: Vercel Deployment Setup

**Files:**
- Modify: `svelte.config.js`

**Step 1: Install Vercel adapter**

```bash
npm install -D @sveltejs/adapter-vercel
```

**Step 2: Update svelte.config.js**

```js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter()
	}
};

export default config;
```

**Step 3: Verify build works**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add svelte.config.js package.json package-lock.json
git commit -m "chore: configure Vercel adapter for deployment"
```

---

### Task 12: Final Polish & Manual Test

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

**Step 2: Manual test checklist**

- [ ] Start 4-player Swiss → 3 rounds, no bye
- [ ] Start 5-player Swiss → bye assigned correctly
- [ ] Start 4-player Round Robin → everyone plays everyone
- [ ] Scores persist after page reload
- [ ] Standings sort correctly
- [ ] "New Tournament" resets everything
- [ ] Build succeeds: `npm run build`

**Step 3: Final commit**

```bash
git add -A
git commit -m "chore: final polish and verification"
```
