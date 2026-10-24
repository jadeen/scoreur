<script setup>
import { computed, ref, watch } from "vue";
import { categories, playersLabel } from "../lib/gameCategories";
import { scoringRules } from "../lib/scoringRules";
import { supabase } from "../lib/supabase";

const props = defineProps({
  slug: { type: String, required: true },
});

const game = ref(null);
const loading = ref(true);
const notFound = ref(false);
const error = ref(null);

const gameColors = {
  wizard: "var(--game-wizard)",
  odin: "var(--game-odin)",
  bingo: "var(--game-bingo)",
};

const traitChips = computed(() => [
  playersLabel(game.value),
  ...categories.filter((c) => c.key !== "solo" && c.test(game.value)).map((c) => c.label),
]);

watch(
  () => props.slug,
  async (slug) => {
    loading.value = true;
    error.value = null;
    notFound.value = false;
    game.value = null;

    const { data, error: fetchError } = await supabase
      .from("games")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (fetchError) {
      error.value = fetchError.message;
    } else if (!data) {
      notFound.value = true;
    } else {
      game.value = data;
    }
    loading.value = false;
  },
  { immediate: true },
);
</script>

<template>
  <div>
    <p v-if="loading" class="muted">Chargement…</p>
    <p v-else-if="error" class="muted">Impossible de charger ce jeu pour le moment.</p>
    <p v-else-if="notFound" class="muted">Ce jeu n'existe pas.</p>

    <div v-else class="jeu-layout">
      <div class="jeu-main">
        <div class="ph jeu-ban" :style="{ background: gameColors[game.slug] }" />
        <h1 class="h1">{{ game.name }}</h1>
        <div class="chips">
          <span v-for="trait in traitChips" :key="trait" class="chip">{{ trait }}</span>
        </div>
        <p v-if="game.description" class="muted">{{ game.description }}</p>
        <div v-if="scoringRules[game.sheet]" class="box">
          <span class="label">Comment on compte</span>
          <p class="muted">{{ scoringRules[game.sheet] }}</p>
        </div>
      </div>
      <div class="jeu-side">
        <div class="note">
          Connecte-toi pour enregistrer une partie de {{ game.name }} et suivre tes statistiques.
        </div>
      </div>
    </div>
  </div>
</template>
