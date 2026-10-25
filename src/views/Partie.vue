<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { user } from "../lib/auth";
import { formatDateLong } from "../lib/formatDate";
import { rankPlayers } from "../lib/ranking";
import { supabase } from "../lib/supabase";

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
      "id, played_at, notes, games(name, lower_wins), match_players(score, players(id, name))",
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
    <p v-else-if="notFound" class="muted">Cette partie n'existe pas.</p>

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
