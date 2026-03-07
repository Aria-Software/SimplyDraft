<script lang="ts">
	import type { Round, Player } from '$lib/types';
	import MatchCard from './MatchCard.svelte';

	interface Props {
		round: Round;
		roundNumber: number;
		totalRounds: number;
		players: Player[];
		allMatchesComplete: boolean;
		onSubmitScore: (matchIndex: number, score1: number, score2: number) => void;
		onNextRound: () => void;
		tournamentCompleted: boolean;
	}

	let { round, roundNumber, totalRounds, players, allMatchesComplete, onSubmitScore, onNextRound, tournamentCompleted }: Props = $props();

	let byePlayer = $derived(
		round.byePlayerId ? players.find(p => p.id === round.byePlayerId) : null
	);
</script>

<div class="space-y-4">
	<h2 class="text-xl font-bold text-center">Round {roundNumber} / {totalRounds}</h2>

	{#if byePlayer}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center text-sm">
			<span class="font-medium">{byePlayer.name}</span> has a bye (2-0 win)
		</div>
	{/if}

	<div class="space-y-3">
		{#each round.matches as match, i}
			<MatchCard {match} {players} matchIndex={i} {onSubmitScore} />
		{/each}
	</div>

	{#if allMatchesComplete && !tournamentCompleted}
		<button
			onclick={onNextRound}
			class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
		>
			{roundNumber >= totalRounds ? 'Finish Tournament' : 'Next Round'}
		</button>
	{/if}
</div>
