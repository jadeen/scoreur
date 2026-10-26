<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import CartonBingo from "../components/CartonBingo.vue";
import Introuvable from "../components/Introuvable.vue";
import TableauManches from "../components/TableauManches.vue";
import { BINGO_TIER_KEYS, BINGO_TIER_LABELS } from "../lib/bingoScoring";
import { user } from "../lib/auth";
import { formatDateLong } from "../lib/formatDate";
import { odinLedgerRows } from "../lib/odinScoring";
import { rankPlayers } from "../lib/ranking";
import { supabase } from "../lib/supabase";
import { wizardLedgerRows } from "../lib/wizardScoring";

const props = defineProps({
  id: { type: String, required: true },
});

const router = useRouter();

const match = ref(null);
const loading = ref(true);
const notFound = ref(false);
const loadError = ref(null);

const confirmingDelete = ref(false);
const deleting = ref(false);
const deleteError = ref(null);

async function loadMatch() {
  loading.value = true;
  notFound.value = false;
  loadError.value = null;
  confirmingDelete.value = false;
  deleteError.value = null;

  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, played_at, notes, details, details_format, games(name, lower_wins), match_players(score, players(id, name))",
    )
    .eq("id", props.id)
    .maybeSingle();
  if (error) {
    loadError.value = error.message;
  } else if (!data) {
    notFound.value = true;
  } else {
    match.value = data;
  }
  loading.value = false;
}

watch(
  [user, () => props.id],
  ([currentUser]) => {
    if (currentUser) {
      loadMatch();
    } else {
      match.value = null;
      loading.value = false;
    }
  },
  { immediate: true },
);

const ranked = computed(() => {
  const players = match.value.match_players.map((player) => ({
    id: player.players.id,
    name: player.players.name,
    score: player.score,
  }));
  return rankPlayers(players, match.value.games.lower_wins);
});

const winners = computed(() => ranked.value.filter((player) => player.isWinner));
const winnersLabel = computed(() => winners.value.map((player) => player.name).join(", "));
const playersCountLabel = computed(() =>
  ranked.value.length === 1 ? "solo" : `${ranked.value.length} joueurs`,
);

const scoreLedger = computed(() => {
  const format = match.value.details_format;
  if (format !== "wizard-v1" && format !== "odin-v1") return null;

  const namesById = new Map(
    match.value.match_players.map((mp) => [mp.players.id, mp.players.name]),
  );
  const ledgerPlayers = match.value.details.joueurs.map((id) => ({ id, name: namesById.get(id) }));

  const rows =
    format === "wizard-v1"
      ? wizardLedgerRows(
          match.value.details.manches.map((manche) => ({
            bids: manche.annonces,
            tricks: manche.plis,
          })),
          ledgerPlayers.length,
        )
      : odinLedgerRows(match.value.details.manches, ledgerPlayers.length);

  return { players: ledgerPlayers, rows, format };
});

const bingoDetail = computed(() => {
  if (match.value.details_format !== "bingo-v1") return null;
  const wonTiers = BINGO_TIER_KEYS.filter((key) => match.value.details.gagne[key]).map(
    (key) => BINGO_TIER_LABELS[key],
  );
  return { card: match.value.details.carton, tirage: match.value.details.tirage, wonTiers };
});

async function deleteMatch() {
  deleting.value = true;
  deleteError.value = null;
  const { error } = await supabase.from("matches").delete().eq("id", match.value.id);
  deleting.value = false;
  if (error) {
    deleteError.value = "Impossible de supprimer cette partie pour le moment.";
    return;
  }
  router.push("/historique");
}
</script>

<template>
  <div>
    <div v-if="!user" class="note connect-note">
      Connecte-toi avec Google pour revoir tes parties.
    </div>
    <p v-else-if="loading" class="muted">Chargement…</p>
    <p v-else-if="loadError" class="muted">Impossible de charger cette partie pour le moment.</p>
    <Introuvable
      v-else-if="notFound"
      title="Partie introuvable"
      message="Cette partie n'existe pas, ou plus. Elle a peut-être été supprimée."
      primary-label="Voir l'historique"
      primary-to="/historique"
      secondary-label="Retour à l'accueil"
      secondary-to="/"
    />

    <div v-else class="partie-detail">
      <div>
        <h1 class="h1">{{ match.games.name }}</h1>
        <p class="muted">{{ formatDateLong(match.played_at) }} · {{ playersCountLabel }}</p>
      </div>

      <div class="win">
        <span class="ph" aria-hidden="true"></span>
        <span class="muted">{{ winners.length > 1 ? "Vainqueurs" : "Vainqueur" }}</span>
        <strong>{{ winnersLabel }}</strong>
        <span class="muted">{{ winners[0].score }} points</span>
      </div>

      <div>
        <div v-for="player in ranked" :key="player.id" class="rk">
          <span class="n">{{ player.rank }}</span>
          <span>{{ player.name }}</span>
          <span class="p">{{ player.score }}</span>
        </div>
      </div>

      <div v-if="scoreLedger" class="ledger-section">
        <h2 class="h2">Feuille de score</h2>
        <TableauManches :players="scoreLedger.players" :rows="scoreLedger.rows" />
        <p class="muted">
          Feuille redessinée à partir du détail archivé (format {{ scoreLedger.format }}), en
          lecture seule.
        </p>
      </div>

      <div v-if="bingoDetail" class="box">
        <h2 class="h2">Carton</h2>
        <CartonBingo :card="bingoDetail.card" :tirage="bingoDetail.tirage" />
        <p class="muted">
          {{ bingoDetail.tirage.length }} numéros tirés · {{ bingoDetail.wonTiers.join(", ") }}
        </p>
        <p class="muted">
          Feuille redessinée à partir du détail archivé (format bingo-v1), en lecture seule.
        </p>
      </div>

      <div v-if="match.notes" class="box">
        <p class="muted">{{ match.notes }}</p>
      </div>

      <button
        v-if="!confirmingDelete"
        class="danger"
        type="button"
        @click="confirmingDelete = true"
      >
        Supprimer cette partie
      </button>
      <div v-else class="confirm-delete">
        <p class="muted">Supprimer définitivement cette partie ?</p>
        <p v-if="deleteError" class="muted error-delete">{{ deleteError }}</p>
        <div class="confirm-delete-actions">
          <button class="btn" type="button" :disabled="deleting" @click="confirmingDelete = false">
            Annuler
          </button>
          <button class="btn red" type="button" :disabled="deleting" @click="deleteMatch">
            {{ deleting ? "Suppression…" : "Supprimer" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
