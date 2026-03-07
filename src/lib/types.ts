export type TournamentFormat = 'swiss' | 'round-robin';

export interface Player {
	id: string;
	name: string;
}

export interface Match {
	player1Id: string;
	player2Id: string;
	score1: number | null;
	score2: number | null;
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
