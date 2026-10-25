<script setup>
import { computed, ref } from "vue";
import { ODIN_MAX_CARDS, odinLedgerRows, odinOver, odinTotals } from "../lib/odinScoring";
import Stepper from "./Stepper.vue";
import TableauManches from "./TableauManches.vue";

const props = defineProps({
  players: { type: Array, required: true },
  target: { type: Number, required: true },
  initialDetails: { type: Object, default: null },
});
const emit = defineEmits(["update:scores", "update:details", "fin"]);

const n = computed(() => props.players.length);

const rounds = ref(props.initialDetails ? props.initialDetails.manches.map((m) => [...m]) : []);
const draft = ref(Array(n.value).fill(0));

const totals = computed(() => odinTotals(rounds.value, n.value));
const over = computed(() => odinOver(totals.value, props.target));
const ledgerRows = computed(() => odinLedgerRows(rounds.value, n.value));

function setCards(index, value) {
  draft.value[index] = Math.min(Math.max(value, 0), ODIN_MAX_CARDS);
}

function emitState() {
  const scores = {};
  props.players.forEach((player, i) => (scores[player.id] = totals.value[i]));
  emit("update:scores", scores);
  emit("update:details", {
    joueurs: props.players.map((player) => player.id),
    seuil: props.target,
    manches: rounds.value.map((round) => [...round]),
  });
}

emitState();

function commitRound() {
  rounds.value = [...rounds.value, draft.value.slice()];
  draft.value = Array(n.value).fill(0);
  emitState();
  if (over.value) emit("fin");
}

function undoLastRound() {
  const last = rounds.value[rounds.value.length - 1];
  rounds.value = rounds.value.slice(0, -1);
  draft.value = last.slice();
  emitState();
}
</script>

<template>
  <div v-if="!over" class="hand">
    <div class="hand-head">
      <div>
        <p class="muted">Fin de partie à {{ target }} points</p>
        <h2 class="h2">Fin de la manche</h2>
      </div>
    </div>
    <p class="muted">Combien de cartes reste-t-il à chacun ?</p>

    <div v-for="(player, index) in players" :key="player.id" class="pr">
      <span :class="{ 'odin-empty': draft[index] === 0 }">{{ player.name }}</span>
      <Stepper
        :model-value="draft[index]"
        @update:model-value="(value) => setCards(index, value)"
      />
    </div>

    <div class="hand-actions">
      <button class="btn primary" type="button" @click="commitRound">Valider la manche</button>
    </div>
  </div>

  <div class="ledger-section">
    <div class="ledger-head">
      <h2 class="h2">Feuille de score</h2>
      <button v-if="rounds.length" class="btn sm" type="button" @click="undoLastRound">
        Annuler la dernière manche
      </button>
    </div>
    <TableauManches :players="players" :rows="ledgerRows" />
  </div>
</template>
