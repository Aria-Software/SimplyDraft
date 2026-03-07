<script lang="ts">
	import { onMount } from 'svelte';
	import { createTournamentState } from '$lib/tournament.svelte';
	import SetupView from '$lib/components/SetupView.svelte';
	import RoundView from '$lib/components/RoundView.svelte';
	import StandingsView from '$lib/components/StandingsView.svelte';

	const tournament = createTournamentState();

	let activeTab = $state<'round' | 'standings'>('round');

	onMount(() => {
		tournament.init();
	});
</script>

<svelte:head>
	<title>SimplyDraft</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col">
	<div class="max-w-2xl mx-auto px-4 py-8 flex-1">
		{#if !tournament.tournament}
			<SetupView onStart={tournament.startTournament} />
		{:else}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h1 class="text-2xl font-bold">SimplyDraft</h1>
					<button
						onclick={() => { if (confirm('Start a new tournament?')) tournament.reset(); }}
						class="text-sm text-red-500 hover:text-red-700"
					>New Tournament</button>
				</div>

				<div class="flex gap-2 border-b border-gray-200">
					<button
						class="py-2 px-4 -mb-px transition-colors {activeTab === 'round' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
						onclick={() => activeTab = 'round'}
					>Rounds</button>
					<button
						class="py-2 px-4 -mb-px transition-colors {activeTab === 'standings' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}"
						onclick={() => activeTab = 'standings'}
					>Standings</button>
				</div>

				{#if activeTab === 'round' && tournament.currentRoundData}
					<RoundView
						round={tournament.currentRoundData}
						roundNumber={tournament.tournament.currentRound}
						totalRounds={tournament.totalRounds}
						players={tournament.tournament.players}
						bestOf={tournament.tournament.bestOf}
						allMatchesComplete={tournament.allMatchesComplete}
						onSubmitScore={tournament.submitScore}
						onNextRound={tournament.nextRound}
						tournamentCompleted={tournament.tournament.completed}
					/>
				{/if}

				{#if activeTab === 'standings'}
					<StandingsView
						standings={tournament.standings}
						tournamentCompleted={tournament.tournament.completed}
					/>
				{/if}

				{#if tournament.tournament.completed}
					<div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
						<p class="text-green-800 font-bold text-lg">Tournament Complete!</p>
						<p class="text-green-600">Winner: {tournament.standings[0]?.player.name}</p>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<footer class="flex items-center justify-center gap-1.5 text-[10px] text-gray-300 py-3 mt-auto">
		<span>Made by Aria Farmani</span>
		<a href="https://github.com/Aria-Software/SimplyDraft" class="hover:text-gray-600" aria-label="GitHub">
			<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
		</a>
	</footer>
</div>
