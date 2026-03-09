import type { Tournament, TournamentFormat, BestOf, Player, Round, Table, MultiTableEvent, Standing } from './types';
import { generateSwissPairings, getSwissRoundCount } from './pairings';
import { generateRoundRobinSchedule, getRoundRobinRoundCount } from './round-robin';
import { calculateStandings } from './standings';
import { saveTournament, loadTournament, clearTournament, saveEvent, loadEvent, clearEvent } from './storage';

function createId(): string {
	return Math.random().toString(36).substring(2, 9);
}

function createSingleTournament(format: TournamentFormat, players: Player[], bestOf: BestOf): Tournament {
	if (format === 'round-robin') {
		const allRounds = generateRoundRobinSchedule(players);
		return { format, bestOf, players, rounds: allRounds, currentRound: 1, completed: false };
	}
	const stub: Tournament = { format, bestOf, players, rounds: [], currentRound: 0, completed: false };
	const firstRound = generateSwissPairings(stub);
	return { format, bestOf, players, rounds: [firstRound], currentRound: 1, completed: false };
}

export function createTournamentState() {
	let tournament = $state<Tournament | null>(null);
	let event = $state<MultiTableEvent | null>(null);
	let activeTableIndex = $state(0);

	const isMultiTable = $derived(event !== null && event.tables.length > 1);

	const activeTable = $derived.by((): Table | null => {
		if (!event) return null;
		return event.tables[activeTableIndex] ?? null;
	});

	// For single-table mode or the active table in multi-table mode
	const activeTournament = $derived.by((): Tournament | null => {
		if (event) return activeTable?.tournament ?? null;
		return tournament;
	});

	const standings = $derived(activeTournament ? calculateStandings(activeTournament) : []);

	const allTablesStandings = $derived.by((): Map<string, Standing[]> => {
		const map = new Map<string, Standing[]>();
		if (!event) {
			if (tournament) map.set('single', calculateStandings(tournament));
			return map;
		}
		for (const table of event.tables) {
			map.set(table.id, calculateStandings(table.tournament));
		}
		return map;
	});

	const totalRounds = $derived.by(() => {
		if (!activeTournament) return 0;
		if (activeTournament.format === 'round-robin') return getRoundRobinRoundCount(activeTournament.players.length);
		return getSwissRoundCount(activeTournament.players.length);
	});

	const currentRoundData = $derived(
		activeTournament && activeTournament.currentRound > 0
			? activeTournament.rounds[activeTournament.currentRound - 1]
			: null
	);

	const allMatchesComplete = $derived(
		currentRoundData ? currentRoundData.matches.every(m => m.completed) : false
	);

	const nextRoundPreview = $derived.by((): Round | null => {
		if (!activeTournament || activeTournament.completed) return null;
		if (activeTournament.format !== 'round-robin') return null;
		if (activeTournament.currentRound >= totalRounds) return null;
		return activeTournament.rounds[activeTournament.currentRound] ?? null;
	});

	const tableCount = $derived(event ? event.tables.length : tournament ? 1 : 0);

	const allTablesComplete = $derived.by(() => {
		if (event) return event.tables.every(t => t.tournament.completed);
		if (tournament) return tournament.completed;
		return false;
	});

	function init() {
		const savedEvent = loadEvent();
		if (savedEvent) {
			event = savedEvent;
			tournament = null;
			return;
		}
		const saved = loadTournament();
		if (saved) tournament = saved;
	}

	function persist() {
		if (event) {
			saveEvent(event);
		} else if (tournament) {
			saveTournament(tournament);
		}
	}

	function startTournament(format: TournamentFormat, playerNames: string[], bestOf: BestOf = 3, tables: number = 1) {
		if (tables <= 1) {
			// Single-table mode (backwards compatible)
			const players: Player[] = playerNames.map(name => ({ id: createId(), name }));
			tournament = createSingleTournament(format, players, bestOf);
			event = null;
			clearEvent();
			persist();
			return;
		}

		// Multi-table mode
		const allPlayers: Player[] = playerNames.map(name => ({ id: createId(), name }));
		const playersPerTable = Math.ceil(allPlayers.length / tables);
		const tableList: Table[] = [];

		for (let i = 0; i < tables; i++) {
			const tablePlayers = allPlayers.slice(i * playersPerTable, (i + 1) * playersPerTable);
			if (tablePlayers.length < 2) continue;
			tableList.push({
				id: createId(),
				name: `Table ${i + 1}`,
				tournament: createSingleTournament(format, tablePlayers, bestOf)
			});
		}

		event = { tables: tableList, format, bestOf };
		tournament = null;
		activeTableIndex = 0;
		clearTournament();
		persist();
	}

	function setActiveTable(index: number) {
		if (event && index >= 0 && index < event.tables.length) {
			activeTableIndex = index;
		}
	}

	function submitScore(matchIndex: number, score1: number, score2: number) {
		if (!activeTournament || !currentRoundData) return;
		const match = currentRoundData.matches[matchIndex];
		match.score1 = score1;
		match.score2 = score2;
		match.completed = true;
		persist();
	}

	function nextRound() {
		if (!activeTournament) return;

		const maxRounds = activeTournament.format === 'round-robin'
			? getRoundRobinRoundCount(activeTournament.players.length)
			: getSwissRoundCount(activeTournament.players.length);

		if (activeTournament.currentRound >= maxRounds) {
			activeTournament.completed = true;
			persist();
			return;
		}

		if (activeTournament.format === 'swiss') {
			const newRound = generateSwissPairings(activeTournament);
			activeTournament.rounds.push(newRound);
		}

		activeTournament.currentRound++;
		persist();
	}

	function reset() {
		tournament = null;
		event = null;
		activeTableIndex = 0;
		clearTournament();
		clearEvent();
	}

	return {
		get tournament() { return activeTournament; },
		get event() { return event; },
		get standings() { return standings; },
		get allTablesStandings() { return allTablesStandings; },
		get totalRounds() { return totalRounds; },
		get currentRoundData() { return currentRoundData; },
		get allMatchesComplete() { return allMatchesComplete; },
		get nextRoundPreview() { return nextRoundPreview; },
		get isMultiTable() { return isMultiTable; },
		get activeTableIndex() { return activeTableIndex; },
		get activeTable() { return activeTable; },
		get tableCount() { return tableCount; },
		get allTablesComplete() { return allTablesComplete; },
		init,
		startTournament,
		setActiveTable,
		submitScore,
		nextRound,
		reset
	};
}
