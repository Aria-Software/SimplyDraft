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
			format: 'swiss', players: makePlayers(4), rounds: [], currentRound: 0, completed: false
		};
		const round = generateSwissPairings(t);
		expect(round.matches).toHaveLength(2);
		expect(round.byePlayerId).toBeUndefined();
	});

	test('5 players: 2 matches + 1 bye', () => {
		const t: Tournament = {
			format: 'swiss', players: makePlayers(5), rounds: [], currentRound: 0, completed: false
		};
		const round = generateSwissPairings(t);
		expect(round.matches).toHaveLength(2);
		expect(round.byePlayerId).toBeDefined();
	});

	test('bye goes to lowest standing player who hasnt had bye', () => {
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
		expect(pairSet).not.toContain('1-2');
		expect(pairSet).not.toContain('3-4');
	});
});
