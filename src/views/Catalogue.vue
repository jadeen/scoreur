<script setup>
import { computed, onMounted, ref } from "vue";
import { displayTags, playersLabel } from "../lib/playersLabel";
import { supabase } from "../lib/supabase";

const games = ref([]);
const loading = ref(true);
const error = ref(null);
const search = ref("");
const activeTags = ref([]);

const gameColors = {
  wizard: "var(--game-wizard)",
  odin: "var(--game-odin)",
  bingo: "var(--game-bingo)",
};

const availableTags = computed(() => [...new Set(games.value.flatMap((game) => game.tags))].sort());

function toggleTag(tag) {
  const i = activeTags.value.indexOf(tag);
  if (i === -1) {
    activeTags.value.push(tag);
  } else {
    activeTags.value.splice(i, 1);
  }
}

const filteredGames = computed(() => {
  const query = search.value.trim().toLowerCase();
  return games.value.filter((game) => {
    if (query && !game.name.toLowerCase().includes(query)) return false;
    if (activeTags.value.length === 0) return true;
    return activeTags.value.some((tag) => game.tags.includes(tag));
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
          :class="{ on: activeTags.length === 0 }"
          @click="activeTags = []"
        >
          Tous
        </button>
        <button
          v-for="tag in availableTags"
          :key="tag"
          type="button"
          class="chip"
          :class="{ on: activeTags.includes(tag) }"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>

      <div class="checkbox-filters">
        <span class="label">Filtres</span>
        <label v-for="tag in availableTags" :key="tag" class="opt">
          <input type="checkbox" :checked="activeTags.includes(tag)" @change="toggleTag(tag)" />
          {{ tag }}
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
            <div class="item-tags">
              <span class="tag">{{ playersLabel(game) }}</span>
              <span v-for="tag in displayTags(game)" :key="tag" class="tag">{{ tag }}</span>
            </div>
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
</template>
