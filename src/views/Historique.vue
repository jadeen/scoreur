<script setup>
import { ref, watch } from "vue";
import ConnexionRequise from "../components/ConnexionRequise.vue";
import { formatDateShort } from "../lib/formatDate";
import { user } from "../lib/auth";
import { playersCountLabel, winnersSummary } from "../lib/matchSummary";
import { supabase } from "../lib/supabase";

const matches = ref([]);
const loading = ref(true);
const loadError = ref(null);

async function loadMatches() {
  loading.value = true;
  loadError.value = null;
  const { data, error } = await supabase
    .from("matches")
    .select("id, played_at, games(name, color), match_players(score, is_winner, players(name))")
    .order("played_at", { ascending: false });
  if (error) {
    loadError.value = error.message;
  } else {
    matches.value = data;
  }
  loading.value = false;
}

watch(
  user,
  (current) => {
    if (current) {
      loadMatches();
    } else {
      matches.value = [];
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <ConnexionRequise
    v-if="!user"
    title="Historique privé"
    message="Connecte-toi avec Google pour voir tes parties passées."
  />

  <template v-else>
    <h1 class="h1">Historique</h1>
    <div class="historique-layout">
      <p v-if="loading" class="muted state-loading">Chargement des parties…</p>
      <p v-else-if="loadError" class="muted state-error">
        Impossible de charger l'historique pour le moment.
      </p>
      <p v-else-if="matches.length === 0" class="muted state-empty">
        Aucune partie enregistrée pour l'instant.
      </p>

      <div v-else class="match-list">
        <router-link
          v-for="match in matches"
          :key="match.id"
          class="item"
          :to="{ name: 'partie', params: { id: match.id } }"
        >
          <span class="jet" :style="{ background: match.games.color }"></span>
          <span class="t">
            <span class="row">
              <strong>{{ match.games.name }}</strong>
              <span class="muted">{{ formatDateShort(match.played_at) }}</span>
            </span>
            <span class="muted">{{ playersCountLabel(match) }} · {{ winnersSummary(match) }}</span>
          </span>
        </router-link>
      </div>
    </div>
  </template>
</template>
