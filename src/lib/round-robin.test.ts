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
				expect(allPairs.has(key)).toBe(false);
				allPairs.add(key);
			}
		}
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
