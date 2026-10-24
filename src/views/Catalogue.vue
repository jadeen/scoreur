<script setup>
import { computed, onMounted, ref } from "vue";
import { supabase } from "../lib/supabase";

const games = ref([]);
const loading = ref(true);
const error = ref(null);
const search = ref("");
const activeCategories = ref([]);

const gameColors = {
  wizard: "var(--game-wizard)",
  odin: "var(--game-odin)",
  bingo: "var(--game-bingo)",
};

const categories = [
  { key: "solo", label: "Solo", test: (g) => g.players_min === 1 && g.players_max === 1 },
  {
    key: "manches",
    label: "Par manches",
    test: (g) => g.sheet !== "generique" && !(g.players_min === 1 && g.players_max === 1),
  },
  { key: "bas", label: "Le plus bas gagne", test: (g) => g.lower_wins },
];

function toggleCategory(key) {
  const i = activeCategories.value.indexOf(key);
  if (i === -1) {
    activeCategories.value.push(key);
  } else {
    activeCategories.value.splice(i, 1);
  }
}

function playersLabel(game) {
  if (game.players_min === 1 && game.players_max === 1) return "solo";
  if (game.players_min === game.players_max) return `${game.players_min} joueurs`;
  return `${game.players_min} à ${game.players_max} joueurs`;
}

const filteredGames = computed(() => {
  const query = search.value.trim().toLowerCase();
  return games.value.filter((game) => {
    if (query && !game.name.toLowerCase().includes(query)) return false;
    if (activeCategories.value.length === 0) return true;
    return categories.some(
      (category) => activeCategories.value.includes(category.key) && category.test(game),
    );
  });
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
    <div class="catalogue-layout">
      <div class="filters-col">
        <label class="field" for="recherche-jeu">
          Rechercher
          <input id="recherche-jeu" v-model="search" type="search" placeholder="Nom d'un jeu" />
        </label>

        <div class="chip-filters">
          <button
            type="button"
            class="chip"
            :class="{ on: activeCategories.length === 0 }"
            @click="activeCategories = []"
          >
            Tous
          </button>
          <button
            v-for="category in categories"
            :key="category.key"
            type="button"
            class="chip"
            :class="{ on: activeCategories.includes(category.key) }"
            @click="toggleCategory(category.key)"
          >
            {{ category.label }}
          </button>
        </div>

        <div class="checkbox-filters">
          <span class="label">Filtres</span>
          <label v-for="category in categories" :key="category.key" class="opt">
            <input
              type="checkbox"
              :checked="activeCategories.includes(category.key)"
              @change="toggleCategory(category.key)"
            />
            {{ category.label }}
          </label>
        </div>

        <div class="note filters-note">
          <strong>Il manque un jeu ?</strong>
          <span>La proposition de jeux arrive dans une prochaine étape.</span>
        </div>
      </div>

      <div class="list-col">
        <p v-if="loading" class="muted">Chargement du catalogue…</p>
        <p v-else-if="error" class="muted">Impossible de charger le catalogue pour le moment.</p>
        <p v-else-if="filteredGames.length === 0" class="muted">
          Aucun jeu ne correspond à ta recherche.
        </p>

        <div class="game-list">
          <router-link
            v-for="game in filteredGames"
            :key="game.slug"
            class="item"
            :to="{ name: 'jeu', params: { slug: game.slug } }"
          >
            <div class="ph item-thumb" :style="{ background: gameColors[game.slug] }" />
            <div class="t">
              <strong>{{ game.name }}</strong>
              <span class="item-meta">{{ playersLabel(game) }}</span>
            </div>
            <span class="item-chevron" aria-hidden="true">›</span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="note list-note">
      <strong>Il manque un jeu ?</strong>
      <span>La proposition de jeux arrive dans une prochaine étape.</span>
    </div>
  </div>
</template>
