<script lang="ts">
	import type { TournamentFormat } from '$lib/types';

	interface Props {
		onStart: (format: TournamentFormat, players: string[]) => void;
	}

	let { onStart }: Props = $props();

	let format = $state<TournamentFormat>('swiss');
	let playerCount = $state(4);
	let playerNames = $state<string[]>(Array(8).fill(''));

	let validPlayers = $derived(
		playerNames.slice(0, playerCount).filter(n => n.trim().length > 0)
	);
	let canStart = $derived(validPlayers.length === playerCount);

	function handleStart() {
		if (!canStart) return;
		onStart(format, validPlayers);
	}
</script>

<div class="max-w-lg mx-auto space-y-6">
	<h1 class="text-3xl font-bold text-center">SimplyDraft</h1>
	<p class="text-center text-gray-500">Magic: The Gathering Tournament Organizer</p>

	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium mb-2">Format</label>
			<div class="flex gap-2">
				<button
					class="flex-1 py-2 px-4 rounded-lg border-2 transition-colors {format === 'swiss' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}"
					onclick={() => format = 'swiss'}
				>Swiss</button>
				<button
					class="flex-1 py-2 px-4 rounded-lg border-2 transition-colors {format === 'round-robin' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}"
					onclick={() => format = 'round-robin'}
				>Round Robin</button>
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2">Players</label>
			<div class="flex gap-2">
				{#each [4, 5, 6, 7, 8] as count}
					<button
						class="flex-1 py-2 px-3 rounded-lg border-2 transition-colors {playerCount === count ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}"
						onclick={() => playerCount = count}
					>{count}</button>
				{/each}
			</div>
		</div>

		<div class="space-y-2">
			{#each { length: playerCount } as _, i}
				<input
					type="text"
					placeholder="Player {i + 1}"
					bind:value={playerNames[i]}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			{/each}
		</div>

		<button
			onclick={handleStart}
			disabled={!canStart}
			class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>Start Tournament</button>
	</div>
</div>
