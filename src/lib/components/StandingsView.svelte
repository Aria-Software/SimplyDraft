<script lang="ts">
	import type { Standing } from '$lib/types';

	interface Props {
		standings: Standing[];
		tournamentCompleted: boolean;
	}

	let { standings, tournamentCompleted }: Props = $props();

	function pct(value: number): string {
		return (value * 100).toFixed(1) + '%';
	}
</script>

<div class="space-y-4">
	<h2 class="text-xl font-bold text-center">
		{tournamentCompleted ? 'Final Standings' : 'Standings'}
	</h2>

	<div class="overflow-x-auto">
		<table class="w-full text-sm">
			<thead>
				<tr class="border-b border-gray-300">
					<th class="text-left py-2 px-2">#</th>
					<th class="text-left py-2 px-2">Player</th>
					<th class="text-center py-2 px-2">Pts</th>
					<th class="text-center py-2 px-2">OMW%</th>
					<th class="text-center py-2 px-2">GW%</th>
					<th class="text-center py-2 px-2">OGW%</th>
				</tr>
			</thead>
			<tbody>
				{#each standings as standing, i}
					<tr class="border-b border-gray-100 {i === 0 && tournamentCompleted ? 'bg-yellow-50 font-bold' : ''}">
						<td class="py-2 px-2">{i + 1}</td>
						<td class="py-2 px-2">{standing.player.name}</td>
						<td class="text-center py-2 px-2">{standing.matchPoints}</td>
						<td class="text-center py-2 px-2">{pct(standing.omwPct)}</td>
						<td class="text-center py-2 px-2">{pct(standing.gameWinPct)}</td>
						<td class="text-center py-2 px-2">{pct(standing.ogwPct)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
