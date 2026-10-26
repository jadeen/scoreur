<script setup>
import { computed, ref, watch } from "vue";
import Introuvable from "../components/Introuvable.vue";
import VignetteJeu from "../components/VignetteJeu.vue";
import { user } from "../lib/auth";
import { setPageTitle } from "../lib/pageTitle";
import { displayTags, playersLabel } from "../lib/playersLabel";
import { supabase } from "../lib/supabase";

const props = defineProps({
  slug: { type: String, required: true },
});

const game = ref(null);
const loading = ref(true);
const notFound = ref(false);
const error = ref(null);

const stats = ref([]);
const statsLoading = ref(false);
const statsError = ref(null);

const traitChips = computed(() => [playersLabel(game.value), ...displayTags(game.value)]);

async function loadStats(gameId) {
  if (!user.value) {
    stats.value = [];
    return;
  }
  statsLoading.value = true;
  statsError.value = null;
  const { data, error: statsFetchError } = await supabase
    .from("player_game_stats")
    .select("*")
    .eq("game_id", gameId)
    .order("victoires", { ascending: false });
  if (statsFetchError) {
    statsError.value = statsFetchError.message;
  } else {
    stats.value = data;
  }
  statsLoading.value = false;
}

watch(
  () => props.slug,
  async (slug) => {
    loading.value = true;
    error.value = null;
    notFound.value = false;
    game.value = null;
    stats.value = [];

    const { data, error: fetchError } = await supabase
      .from("games")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (fetchError) {
      error.value = fetchError.message;
    } else if (!data) {
      notFound.value = true;
      setPageTitle("Jeu introuvable");
    } else {
      game.value = data;
      setPageTitle(game.value.name);
    }
    loading.value = false;

    if (game.value) {
      await loadStats(game.value.id);
    }
  },
  { immediate: true },
);

watch(user, () => {
  if (game.value) {
    loadStats(game.value.id);
  } else {
    stats.value = [];
  }
});
</script>

<template>
  <div>
    <p v-if="loading" class="muted">Chargement…</p>
    <p v-else-if="error" class="muted">Impossible de charger ce jeu pour le moment.</p>
    <Introuvable
      v-else-if="notFound"
      eyebrow="Jeu introuvable"
      title="Pas dans la boîte"
      :message="`Aucun jeu du catalogue ne correspond à « ${slug} ». Il a peut-être changé de nom.`"
      primary-label="Voir tous les jeux"
      primary-to="/jeux"
      secondary-label="Retour à l'accueil"
      secondary-to="/"
    />

    <div v-else class="jeu-layout">
      <div class="jeu-main">
        <VignetteJeu class="jeu-ban" :name="game.name" :color="game.color" />
        <h1 class="h1">{{ game.name }}</h1>
        <div class="chips">
          <span v-for="trait in traitChips" :key="trait" class="tag">{{ trait }}</span>
        </div>
        <p v-if="game.description" class="muted">{{ game.description }}</p>
        <router-link v-if="user" class="btn primary" :to="`/jeu/${game.slug}/partie`">
          Nouvelle partie de {{ game.name }}
        </router-link>
        <div v-if="game.scoring_summary" class="box">
          <span class="label">Comment on compte</span>
          <p class="muted">{{ game.scoring_summary }}</p>
        </div>
      </div>
      <div class="jeu-side">
        <template v-if="user">
          <span class="label">Mes stats</span>
          <p v-if="statsLoading" class="muted">Chargement…</p>
          <p v-else-if="statsError" class="muted">
            Impossible de charger les statistiques pour le moment.
          </p>
          <p v-else-if="stats.length === 0" class="muted">
            Aucune partie enregistrée pour ce jeu pour l'instant.
          </p>
          <table v-else class="stats-table">
            <thead>
              <tr>
                <th>Joueur</th>
                <th>Parties</th>
                <th>Victoires</th>
                <th>Record</th>
                <th>Moyenne</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in stats" :key="row.player_id">
                <td>{{ row.player_name }}</td>
                <td>{{ row.parties }}</td>
                <td>{{ row.victoires }}</td>
                <td>{{ row.record }}</td>
                <td>{{ row.moyenne }}</td>
              </tr>
            </tbody>
          </table>
        </template>
        <div v-else class="note">
          Connecte-toi pour enregistrer une partie de {{ game.name }} et suivre tes statistiques.
        </div>
      </div>
    </div>
  </div>
</template>
