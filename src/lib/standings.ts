import type { Tournament, Standing } from './types';

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
