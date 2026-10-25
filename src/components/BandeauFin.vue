<script setup>
import { computed, ref } from "vue";
import { rankPlayers } from "../lib/ranking";

const props = defineProps({
  players: { type: Array, required: true },
  lowerWins: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  canSave: { type: Boolean, default: true },
});
const emit = defineEmits(["save", "abandon"]);

const ranked = computed(() => rankPlayers(props.players, props.lowerWins));
const winners = computed(() => ranked.value.filter((player) => player.isWinner));
const winnersLabel = computed(() => winners.value.map((player) => player.name).join(", "));

const notes = ref("");
</script>

<template>
  <div class="bandeau-fin">
    <div class="win">
      <span class="ph" aria-hidden="true"></span>
      <span class="muted">{{ winners.length > 1 ? "Vainqueurs" : "Vainqueur" }}</span>
      <strong>{{ winnersLabel }}</strong>
      <span class="muted">{{ winners[0].score }} points</span>
    </div>

    <h2 class="h2">Classement final</h2>
    <div>
      <div v-for="player in ranked" :key="player.id" class="rk">
        <span class="n">{{ player.rank }}</span>
        <span>{{ player.name }}</span>
        <span class="p">{{ player.score }}</span>
      </div>
    </div>

    <label class="field" for="notes-fin">
      Note sur la soirée (facultatif)
      <textarea
        id="notes-fin"
        v-model="notes"
        placeholder="ex. chez Hugo, première partie d'Inès"
      ></textarea>
    </label>

    <button
      class="btn primary"
      type="button"
      :disabled="saving || !canSave"
      @click="emit('save', notes)"
    >
      {{ saving ? "Enregistrement…" : "Enregistrer la partie" }}
    </button>
    <p v-if="!canSave" class="muted">Seules les parties gagnées sont enregistrées.</p>
    <button class="btn" type="button" :disabled="saving" @click="emit('abandon')">
      Abandonner sans enregistrer
    </button>
  </div>
</template>
