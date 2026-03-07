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

	if (activePlayers.length % 2 !== 0) {
		for (let i = activePlayers.length - 1; i >= 0; i--) {
			if (!previousByes.has(activePlayers[i])) {
				byePlayerId = activePlayers[i];
				activePlayers = activePlayers.filter(id => id !== byePlayerId);
				break;
			}
		}
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
				matches.push({ player1Id: playerIds[i], player2Id: playerIds[j], score1: null, score2: null, completed: false });
				paired.add(playerIds[i]);
				paired.add(playerIds[j]);
				break;
			}
		}
	}

	// Fallback: pair remaining even if rematch
	for (let i = 0; i < playerIds.length; i++) {
		if (paired.has(playerIds[i])) continue;
		for (let j = i + 1; j < playerIds.length; j++) {
			if (paired.has(playerIds[j])) continue;
			matches.push({ player1Id: playerIds[i], player2Id: playerIds[j], score1: null, score2: null, completed: false });
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
			pairings.add([match.player1Id, match.player2Id].sort().join('-'));
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
