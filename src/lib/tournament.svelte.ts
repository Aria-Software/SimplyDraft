import type { Tournament, TournamentFormat, BestOf, Player } from './types';
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

	const totalRounds = $derived.by(() => {
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

	function startTournament(format: TournamentFormat, playerNames: string[], bestOf: BestOf = 3) {
		const players: Player[] = playerNames.map(name => ({ id: createId(), name }));

		if (format === 'round-robin') {
			const allRounds = generateRoundRobinSchedule(players);
			tournament = {
				format,
				bestOf,
				players,
				rounds: allRounds,
				currentRound: 1,
				completed: false
			};
		} else {
			const firstRound = generateSwissPairings({
				format,
				bestOf,
				players,
				rounds: [],
				currentRound: 0,
				completed: false
			});
			tournament = {
				format,
				bestOf,
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
