import type { Tournament, MultiTableEvent } from './types';

const STORAGE_KEY = 'simplydraft-tournament';
const EVENT_STORAGE_KEY = 'simplydraft-event';

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

export function saveEvent(event: MultiTableEvent): void {
	localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(event));
}

export function loadEvent(): MultiTableEvent | null {
	const data = localStorage.getItem(EVENT_STORAGE_KEY);
	if (!data) return null;
	try {
		return JSON.parse(data) as MultiTableEvent;
	} catch {
		return null;
	}
}

export function clearEvent(): void {
	localStorage.removeItem(EVENT_STORAGE_KEY);
}
