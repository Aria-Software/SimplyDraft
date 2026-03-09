<script lang="ts">
	import type { Round, Player, BestOf } from '$lib/types';
	import MatchCard from './MatchCard.svelte';

	interface Props {
		round: Round;
		roundNumber: number;
		totalRounds: number;
		players: Player[];
		bestOf: BestOf;
		allMatchesComplete: boolean;
		onSubmitScore: (matchIndex: number, score1: number, score2: number) => void;
		onNextRound: () => void;
		tournamentCompleted: boolean;
		nextRoundPreview?: Round | null;
	}

	let { round, roundNumber, totalRounds, players, bestOf, allMatchesComplete, onSubmitScore, onNextRound, tournamentCompleted, nextRoundPreview = null }: Props = $props();

	let byePlayer = $derived(
		round.byePlayerId ? players.find(p => p.id === round.byePlayerId) : null
	);

	function playerName(id: string): string {
		return players.find(p => p.id === id)?.name ?? '?';
	}
</script>

<div class="space-y-4">
	<h2 class="text-xl font-bold text-center">Round {roundNumber} / {totalRounds}</h2>

	{#if byePlayer}
		<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center text-sm">
			<span class="font-medium">{byePlayer.name}</span> has a bye ({bestOf === 1 ? '1-0' : '2-0'} win)
		</div>
	{/if}

	<div class="space-y-3">
		{#each round.matches as match, i}
			<MatchCard {match} {players} matchIndex={i} {bestOf} {onSubmitScore} />
		{/each}
	</div>

	{#if allMatchesComplete && !tournamentCompleted}
		{#if nextRoundPreview}
			<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
				<h3 class="font-semibold text-blue-800 text-center text-sm">Next Round Preview</h3>
				{#if nextRoundPreview.byePlayerId}
					<p class="text-xs text-blue-600 text-center">
						<span class="font-medium">{playerName(nextRoundPreview.byePlayerId)}</span> has a bye
					</p>
				{/if}
				<div class="space-y-1">
					{#each nextRoundPreview.matches as match}
						<div class="flex items-center justify-center gap-2 text-sm text-blue-700">
							<span class="font-medium">{playerName(match.player1Id)}</span>
							<span class="text-blue-400">vs</span>
							<span class="font-medium">{playerName(match.player2Id)}</span>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<button
			onclick={onNextRound}
			class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
		>
			{roundNumber >= totalRounds ? 'Finish Tournament' : 'Next Round'}
		</button>
	{/if}
</div>
