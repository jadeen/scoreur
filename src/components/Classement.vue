<script setup>
import { computed } from "vue";
import { rankPlayers } from "../lib/ranking";

const props = defineProps({
  players: { type: Array, required: true },
  lowerWins: { type: Boolean, default: false },
});

const ranked = computed(() => rankPlayers(props.players, props.lowerWins));

function rankLabel(rank) {
  return rank === 1 ? "1er" : `${rank}e`;
}
</script>

<template>
  <div class="classement">
    <div
      v-for="player in ranked"
      :key="player.id"
      class="st"
      :class="{ lead: player.isWinner, neg: !player.isWinner && player.score < 0 }"
    >
      <span>{{ player.name }}</span>
      <b>{{ player.score }}</b>
      <span>{{ rankLabel(player.rank) }}</span>
    </div>
  </div>
</template>
