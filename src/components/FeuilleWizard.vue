<script setup>
import { computed, ref } from "vue";
import {
  wizardDealerIndex,
  wizardLedgerRows,
  wizardRoundCount,
  wizardScore,
  wizardTotals,
  formatSigned,
} from "../lib/wizardScoring";
import Stepper from "./Stepper.vue";
import TableauManches from "./TableauManches.vue";

const props = defineProps({
  players: { type: Array, required: true },
  variant: { type: Boolean, default: false },
  initialDetails: { type: Object, default: null },
});
const emit = defineEmits(["update:scores", "update:details", "fin"]);

const n = computed(() => props.players.length);
const totalRounds = computed(() => wizardRoundCount(n.value));

function emptyRound() {
  return { bids: Array(n.value).fill(0), tricks: Array(n.value).fill(0) };
}

const rounds = ref(
  props.initialDetails
    ? props.initialDetails.manches.map((manche) => ({
        bids: [...manche.annonces],
        tricks: [...manche.plis],
      }))
    : [],
);
const phase = ref("bid");
const cur = ref(emptyRound());

const roundNumber = computed(() => rounds.value.length + 1);
const over = computed(() => rounds.value.length >= totalRounds.value);
const dealerIndex = computed(() => wizardDealerIndex(roundNumber.value, n.value));
const firstToBidIndex = computed(() => (dealerIndex.value + 1) % n.value);
const seatOrder = computed(() =>
  Array.from({ length: n.value }, (_, k) => (firstToBidIndex.value + k) % n.value),
);

const sumBids = computed(() => cur.value.bids.reduce((a, b) => a + b, 0));
const sumTricks = computed(() => cur.value.tricks.reduce((a, b) => a + b, 0));

const bidOk = computed(() => !(props.variant && sumBids.value === roundNumber.value));
const bidStatus = computed(() => {
  const diff = sumBids.value - roundNumber.value;
  const plural = (count, word) => `${count} ${word}${count > 1 ? "s" : ""}`;
  const base = `${plural(sumBids.value, "annoncé")} pour ${plural(roundNumber.value, "pli")}`;
  if (diff === 0) {
    return `${base} · ${props.variant ? "interdit : le total ne doit pas égaler le nombre de plis" : "pile le compte"}`;
  }
  return `${base} · ${diff > 0 ? `sur-annoncé de ${diff}` : `sous-annoncé de ${-diff}`}`;
});

const tricksOk = computed(() => sumTricks.value === roundNumber.value);
const tricksStatus = computed(() => {
  const plural = (count, word) => `${count} ${word}${count > 1 ? "s" : ""}`;
  const base = `${plural(sumTricks.value, "pli")} saisi${sumTricks.value > 1 ? "s" : ""} sur ${roundNumber.value}`;
  if (tricksOk.value) return base;
  const diff = sumTricks.value - roundNumber.value;
  return `${base} · ${diff < 0 ? `il en manque ${-diff}` : `${diff} de trop`}`;
});

const statusOk = computed(() => (phase.value === "bid" ? bidOk.value : tricksOk.value));
const statusText = computed(() => (phase.value === "bid" ? bidStatus.value : tricksStatus.value));

function ordinal(position) {
  return position === 1 ? "1re" : `${position}e`;
}

function tagFor(index, seatPosition) {
  const tags = [];
  if (index === dealerIndex.value) tags.push({ text: "Donne", strong: true });
  if (phase.value === "bid")
    tags.push({ text: `${ordinal(seatPosition)} à annoncer`, strong: false });
  return tags;
}

function pointsFor(index) {
  return wizardScore(cur.value.bids[index], cur.value.tricks[index]);
}

function setBid(index, value) {
  cur.value.bids[index] = Math.min(Math.max(value, 0), roundNumber.value);
}

function setTricks(index, value) {
  cur.value.tricks[index] = Math.min(Math.max(value, 0), roundNumber.value);
}

function emitState() {
  const totals = wizardTotals(rounds.value, n.value);
  const scores = {};
  props.players.forEach((player, i) => (scores[player.id] = totals[i]));
  emit("update:scores", scores);
  emit("update:details", {
    joueurs: props.players.map((player) => player.id),
    premier_donneur: 0,
    variante_pas_egal: props.variant,
    manches: rounds.value.map((round) => ({ annonces: round.bids, plis: round.tricks })),
  });
}

emitState();

function toTricksPhase() {
  phase.value = "tricks";
  const guess = cur.value.bids.slice();
  const sum = guess.reduce((a, b) => a + b, 0);
  cur.value = {
    bids: cur.value.bids,
    tricks: sum === roundNumber.value ? guess : Array(n.value).fill(0),
  };
}

function backToBidPhase() {
  phase.value = "bid";
}

function commitRound() {
  rounds.value = [
    ...rounds.value,
    { bids: cur.value.bids.slice(), tricks: cur.value.tricks.slice() },
  ];
  phase.value = "bid";
  cur.value = emptyRound();
  emitState();
  if (over.value) emit("fin");
}

function undoLastRound() {
  const last = rounds.value[rounds.value.length - 1];
  rounds.value = rounds.value.slice(0, -1);
  phase.value = "tricks";
  cur.value = { bids: last.bids.slice(), tricks: last.tricks.slice() };
  emitState();
}

const ledgerRows = computed(() => wizardLedgerRows(rounds.value, n.value));
</script>

<template>
  <div v-if="!over" class="hand">
    <div class="hand-head">
      <div>
        <p class="muted">{{ roundNumber }} carte{{ roundNumber > 1 ? "s" : "" }} par joueur</p>
        <h2 class="h2">{{ phase === "bid" ? "Annonces" : "Plis réalisés" }}</h2>
      </div>
      <div class="seg">
        <span :class="{ on: phase === 'bid' }">Annonces</span>
        <span :class="{ on: phase === 'tricks' }">Plis</span>
      </div>
    </div>

    <div v-for="(index, k) in seatOrder" :key="players[index].id" class="pr">
      <div class="round-who">
        <strong>{{ players[index].name }}</strong>
        <div class="round-tags">
          <span
            v-for="tag in tagFor(index, k + 1)"
            :key="tag.text"
            class="round-tag"
            :class="{ donne: tag.strong }"
          >
            {{ tag.text }}
          </span>
        </div>
      </div>
      <div class="round-ctl">
        <span v-if="phase === 'tricks'" class="bidref">annonce {{ cur.bids[index] }}</span>
        <Stepper
          :model-value="phase === 'bid' ? cur.bids[index] : cur.tricks[index]"
          @update:model-value="
            (value) => (phase === 'bid' ? setBid(index, value) : setTricks(index, value))
          "
        />
        <span v-if="phase === 'tricks'" class="delta" :class="pointsFor(index) > 0 ? 'pos' : 'neg'">
          {{ formatSigned(pointsFor(index)) }}
        </span>
      </div>
    </div>

    <div class="status" :class="statusOk ? 'ok' : 'warn'">{{ statusText }}</div>

    <div class="hand-actions">
      <button v-if="phase === 'tricks'" class="btn" type="button" @click="backToBidPhase">
        Modifier les annonces
      </button>
      <button
        class="btn primary"
        type="button"
        :disabled="phase === 'bid' ? !bidOk : !tricksOk"
        @click="phase === 'bid' ? toTricksPhase() : commitRound()"
      >
        {{ phase === "bid" ? "Valider les annonces" : "Valider la manche" }}
      </button>
    </div>
  </div>

  <div class="ledger-section">
    <div class="ledger-head">
      <h2 class="h2">Feuille de score · annonce / plis</h2>
      <button v-if="rounds.length" class="btn sm" type="button" @click="undoLastRound">
        Annuler la dernière manche
      </button>
    </div>
    <TableauManches :players="players" :rows="ledgerRows" />
  </div>
</template>
