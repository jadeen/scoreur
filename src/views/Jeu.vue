<script setup>
import { onMounted, ref } from "vue";
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

function playersLabel(g) {
  if (g.players_min === 1 && g.players_max === 1) return "solo";
  if (g.players_min === g.players_max) return `${g.players_min} joueurs`;
  return `${g.players_min} à ${g.players_max} joueurs`;
}

onMounted(async () => {
  const { data, error: fetchError } = await supabase
    .from("games")
    .select("*")
    .eq("slug", props.slug)
    .maybeSingle();
  if (fetchError) {
    error.value = fetchError.message;
  } else if (!data) {
    notFound.value = true;
  } else {
    game.value = data;
  }
  loading.value = false;
});
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
          <span class="chip">{{ playersLabel(game) }}</span>
        </div>
        <p v-if="game.description" class="muted">{{ game.description }}</p>
      </div>
      <div class="jeu-side">
        <div class="note">
          Connecte-toi pour enregistrer une partie de {{ game.name }} et suivre tes statistiques.
        </div>
      </div>
    </div>
  </div>
</template>
