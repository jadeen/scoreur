<script setup>
import { computed, onMounted, ref } from "vue";
import { supabase } from "../lib/supabase";

const games = ref([]);
const loading = ref(true);
const error = ref(null);
const search = ref("");

const gameColors = {
  wizard: "var(--game-wizard)",
  odin: "var(--game-odin)",
  bingo: "var(--game-bingo)",
};

function playersLabel(game) {
  if (game.players_min === 1 && game.players_max === 1) return "solo";
  if (game.players_min === game.players_max) return `${game.players_min} joueurs`;
  return `${game.players_min} à ${game.players_max} joueurs`;
}

const filteredGames = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return games.value;
  return games.value.filter((game) => game.name.toLowerCase().includes(query));
});

onMounted(async () => {
  const { data, error: fetchError } = await supabase.from("games").select("*").order("name");
  if (fetchError) {
    error.value = fetchError.message;
  } else {
    games.value = data;
  }
  loading.value = false;
});
</script>

<template>
  <div>
    <h1 class="h1">Jeux</h1>
    <label class="field" for="recherche-jeu">
      Rechercher
      <input id="recherche-jeu" v-model="search" type="search" placeholder="Nom d'un jeu" />
    </label>

    <p v-if="loading" class="muted">Chargement du catalogue…</p>
    <p v-else-if="error" class="muted">Impossible de charger le catalogue pour le moment.</p>
    <p v-else-if="filteredGames.length === 0" class="muted">
      Aucun jeu ne correspond à ta recherche.
    </p>

    <router-link
      v-for="game in filteredGames"
      :key="game.slug"
      class="item"
      :to="{ name: 'jeu', params: { slug: game.slug } }"
    >
      <div
        class="ph"
        :style="{ width: '56px', height: '56px', flexShrink: 0, background: gameColors[game.slug] }"
      />
      <div class="t">
        <strong>{{ game.name }}</strong>
        <span class="muted">{{ playersLabel(game) }}</span>
      </div>
      <span aria-hidden="true">›</span>
    </router-link>

    <div class="note">
      <strong>Il manque un jeu ?</strong>
      <span>La proposition de jeux arrive dans une prochaine étape.</span>
    </div>
  </div>
</template>
