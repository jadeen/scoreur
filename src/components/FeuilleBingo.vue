<script setup>
import { computed, ref } from "vue";
import {
  BINGO_TIER_KEYS,
  BINGO_TIER_LABELS,
  bingoCardNumbers,
  bingoCompletedRows,
  bingoRowStatus,
  bingoScore,
  bingoTiers,
} from "../lib/bingoScoring";
import CartonBingo from "./CartonBingo.vue";

const props = defineProps({
  players: { type: Array, required: true },
  card: { type: Array, required: true },
  initialDetails: { type: Object, default: null },
});
const emit = defineEmits(["update:scores", "update:details", "fin"]);

const tirage = ref(props.initialDetails ? [...props.initialDetails.tirage] : []);
const msg = ref("");

const mine = computed(() => bingoCardNumbers(props.card));
const rowStatuses = computed(() => props.card.map((row) => bingoRowStatus(row, tirage.value)));
const completedRows = computed(() => bingoCompletedRows(props.card, tirage.value));
const gagne = computed(() => bingoTiers(completedRows.value));

function emitState() {
  const score = bingoScore(gagne.value);
  const scores = {};
  props.players.forEach((player) => (scores[player.id] = score));
  emit("update:scores", scores);
  emit("update:details", {
    carton: props.card,
    tirage: [...tirage.value],
    gagne: { ...gagne.value },
  });
}

emitState();

function toggleNumber(n) {
  if (tirage.value.includes(n)) {
    tirage.value = tirage.value.filter((called) => called !== n);
    msg.value = `${n} retiré.`;
  } else {
    tirage.value = [...tirage.value, n];
    msg.value = mine.value.includes(n)
      ? `${n} : il est sur ton carton !`
      : `${n} : pas sur ton carton.`;
  }
  emitState();
}

function undoLast() {
  const last = tirage.value[tirage.value.length - 1];
  tirage.value = tirage.value.slice(0, -1);
  msg.value = `${last} annulé.`;
  emitState();
}
</script>

<template>
  <div class="hand bingo-card-panel">
    <div class="hand-head">
      <div>
        <p class="muted">
          {{ tirage.length }} numéro{{ tirage.length > 1 ? "s" : "" }} tiré{{
            tirage.length > 1 ? "s" : ""
          }}
        </p>
        <h2 class="h2">Carton</h2>
      </div>
    </div>

    <CartonBingo :card="card" :tirage="tirage" />

    <div
      v-for="(row, r) in rowStatuses"
      :key="r"
      class="row"
      :class="{ 'bingo-complete': row.complete }"
    >
      <span class="label">Ligne {{ r + 1 }}</span>
      <span class="muted">
        {{
          row.complete ? "Complète" : `reste ${row.remaining.length} : ${row.remaining.join(", ")}`
        }}
      </span>
    </div>

    <h2 class="h2">Paliers gagnés</h2>
    <div
      v-for="key in BINGO_TIER_KEYS"
      :key="key"
      class="row"
      :class="{ 'bingo-complete': gagne[key] }"
    >
      <span class="label">{{ BINGO_TIER_LABELS[key] }}</span>
      <span class="muted">{{ gagne[key] ? "Gagné" : "Pas encore" }}</span>
    </div>

    <div class="hand-actions">
      <button class="btn primary" type="button" @click="emit('fin')">Terminer la partie</button>
    </div>
  </div>

  <div class="hand bingo-board-panel">
    <h2 class="h2">Tous les numéros</h2>
    <p class="muted">Cerclés = sur mon carton. Clique pour tirer ou retirer un numéro.</p>
    <div class="bingo-board">
      <button
        v-for="n in 90"
        :key="n"
        type="button"
        class="bingo-ball"
        :class="{ mine: mine.includes(n), on: tirage.includes(n) }"
        @click="toggleNumber(n)"
      >
        {{ n }}
      </button>
    </div>
    <p v-if="msg" class="muted bingo-msg">{{ msg }}</p>
    <button v-if="tirage.length" class="btn sm" type="button" @click="undoLast">
      Annuler le dernier numéro
    </button>
  </div>
</template>
