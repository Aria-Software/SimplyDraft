<script lang="ts">
	import type { TournamentFormat, BestOf } from '$lib/types';

	interface Props {
		onStart: (format: TournamentFormat, players: string[], bestOf: BestOf, tables: number) => void;
	}

	let { onStart }: Props = $props();

	let format = $state<TournamentFormat>('swiss');
	let bestOf = $state<BestOf>(3);
	let tableCount = $state(1);
	let playerCount = $state(4);
	let playerNames = $state<string[]>(Array(32).fill(''));

	const minPlayers = $derived(tableCount * 2);
	const playerOptions = $derived.by(() => {
		if (tableCount <= 1) return [4, 5, 6, 7, 8];
		const min = tableCount * 2;
		const max = tableCount * 8;
		const options: number[] = [];
		for (let i = min; i <= max; i++) {
			options.push(i);
		}
		return options;
	});

	$effect(() => {
		const options = playerOptions;
		if (!options.includes(playerCount)) {
			playerCount = options[0];
		}
	});

	let playersPerTable = $derived.by(() => {
		if (tableCount <= 1) return playerCount;
		return Math.ceil(playerCount / tableCount);
	});

	let tableAssignments = $derived.by(() => {
		if (tableCount <= 1) return null;
		const assignments: { table: number; startIdx: number; endIdx: number; count: number }[] = [];
		const perTable = Math.ceil(playerCount / tableCount);
		for (let t = 0; t < tableCount; t++) {
			const start = t * perTable;
			const end = Math.min(start + perTable, playerCount);
			if (end > start) {
				assignments.push({ table: t + 1, startIdx: start, endIdx: end, count: end - start });
			}
		}
		return assignments;
	});

	let validPlayers = $derived(
		playerNames.slice(0, playerCount).filter(n => n.trim().length > 0)
	);
	let canStart = $derived(validPlayers.length === playerCount);

	function handleStart() {
		if (!canStart) return;
		onStart(format, validPlayers, bestOf, tableCount);
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
			<label class="block text-sm font-medium mb-2">Match Type</label>
			<div class="flex gap-2">
				<button
					class="flex-1 py-2 px-4 rounded-lg border-2 transition-colors {bestOf === 1 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}"
					onclick={() => bestOf = 1}
				>Best of 1</button>
				<button
					class="flex-1 py-2 px-4 rounded-lg border-2 transition-colors {bestOf === 3 ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}"
					onclick={() => bestOf = 3}
				>Best of 3</button>
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2">Tables</label>
			<div class="flex gap-2">
				{#each [1, 2, 3, 4] as count}
					<button
						class="flex-1 py-2 px-3 rounded-lg border-2 transition-colors {tableCount === count ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}"
						onclick={() => tableCount = count}
					>{count}</button>
				{/each}
			</div>
		</div>

		<div>
			<label class="block text-sm font-medium mb-2">Players {tableCount > 1 ? `(${playersPerTable} per table)` : ''}</label>
			<div class="flex gap-2 flex-wrap">
				{#each playerOptions as count}
					<button
						class="py-2 px-3 rounded-lg border-2 transition-colors {playerCount === count ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}"
						onclick={() => playerCount = count}
					>{count}</button>
				{/each}
			</div>
		</div>

		<div class="space-y-2">
			{#if tableAssignments}
				{#each tableAssignments as assignment}
					<div class="space-y-2">
						<p class="text-sm font-medium text-gray-600 mt-3">Table {assignment.table} ({assignment.count} players)</p>
						{#each { length: assignment.endIdx - assignment.startIdx } as _, i}
							<input
								type="text"
								placeholder="Player {assignment.startIdx + i + 1}"
								bind:value={playerNames[assignment.startIdx + i]}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						{/each}
					</div>
				{/each}
			{:else}
				{#each { length: playerCount } as _, i}
					<input
						type="text"
						placeholder="Player {i + 1}"
						bind:value={playerNames[i]}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				{/each}
			{/if}
		</div>

		<button
			onclick={handleStart}
			disabled={!canStart}
			class="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
		>Start Tournament</button>
	</div>
</div>
