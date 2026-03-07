<script lang="ts">
	import type { Match, Player, BestOf } from '$lib/types';

	interface Props {
		match: Match;
		players: Player[];
		matchIndex: number;
		bestOf: BestOf;
		onSubmitScore: (matchIndex: number, score1: number, score2: number) => void;
	}

	let { match, players, matchIndex, bestOf, onSubmitScore }: Props = $props();

	let player1 = $derived(players.find(p => p.id === match.player1Id)!);
	let player2 = $derived(players.find(p => p.id === match.player2Id)!);

	const bo3Options: [number, number][] = [[2, 0], [2, 1], [1, 2], [0, 2]];
	const bo1Options: [number, number][] = [[1, 0], [0, 1]];
	let scoreOptions = $derived(bestOf === 1 ? bo1Options : bo3Options);
</script>

<div class="border border-gray-200 rounded-lg p-4">
	<div class="flex items-center justify-between mb-3">
		<span class="font-medium">{player1.name}</span>
		<span class="text-gray-400">vs</span>
		<span class="font-medium">{player2.name}</span>
	</div>

	{#if match.completed}
		<div class="text-center text-lg font-bold text-green-600">
			{match.score1} - {match.score2}
		</div>
	{:else}
		<div class="flex gap-2 justify-center">
			{#each scoreOptions as [s1, s2]}
				<button
					onclick={() => onSubmitScore(matchIndex, s1, s2)}
					class="px-3 py-1 border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors"
				>{s1}-{s2}</button>
			{/each}
		</div>
	{/if}
</div>
