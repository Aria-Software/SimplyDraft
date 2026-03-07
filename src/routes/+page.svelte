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

<div class="min-h-screen bg-gray-50">
	<div class="max-w-2xl mx-auto px-4 py-8">
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
</div>
