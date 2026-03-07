import { describe, expect, test } from 'vitest';
import { calculateStandings } from './standings';
import type { Tournament } from './types';

function makeTournament(overrides: Partial<Tournament> = {}): Tournament {
	return {
		format: 'swiss',
		bestOf: 3,
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
		expect(standings[0].player.name).toBe('Alice');
		expect(standings[0].matchPoints).toBe(6);
	});
});
