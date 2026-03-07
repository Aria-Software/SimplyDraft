import type { Player, Round, Match } from './types';

export function getRoundRobinRoundCount(playerCount: number): number {
	return playerCount % 2 === 0 ? playerCount - 1 : playerCount;
}

export function generateRoundRobinSchedule(players: Player[]): Round[] {
	const ids = players.map(p => p.id);
	const n = ids.length;
	const isOdd = n % 2 !== 0;

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
