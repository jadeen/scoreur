<script setup>
import { ref, watch } from "vue";
import { signInWithGoogle, user } from "../lib/auth";
import { formatDateShort } from "../lib/formatDate";
import { playersCountLabel, winnersSummary } from "../lib/matchSummary";
import { playersLabel } from "../lib/playersLabel";
import { supabase } from "../lib/supabase";

const featuredGames = ref([]);
const featuredLoading = ref(true);
const featuredError = ref(false);

const recentGames = ref([]);
const recentMatches = ref([]);
const connectedLoading = ref(true);
const connectedError = ref(false);

async function loadVisitor() {
  featuredLoading.value = true;
  featuredError.value = false;
  const { data, error } = await supabase
    .from("games")
    .select("slug, name, color, players_min, players_max")
    .order("id")
    .limit(3);
  if (error) {
    featuredError.value = true;
  } else {
    featuredGames.value = data;
  }
  featuredLoading.value = false;
}

async function loadConnected() {
  connectedLoading.value = true;
  connectedError.value = false;
  const { data, error } = await supabase
    .from("matches")
    .select(
      "id, played_at, games(slug, name, color), match_players(score, is_winner, players(name))",
    )
    .order("played_at", { ascending: false })
    .limit(20);
  if (error) {
    connectedError.value = true;
    connectedLoading.value = false;
    return;
  }

  recentMatches.value = data.slice(0, 3);

  const seenSlugs = new Set();
  const games = [];
  for (const match of data) {
    if (seenSlugs.has(match.games.slug)) continue;
    seenSlugs.add(match.games.slug);
    games.push({ ...match.games, playedAt: match.played_at });
    if (games.length === 3) break;
  }
  recentGames.value = games;
  connectedLoading.value = false;
}

watch(
  user,
  (current) => {
    if (current) {
      loadConnected();
    } else {
      loadVisitor();
    }
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="user" class="accueil-connecte">
    <h1 class="h1">Bonsoir</h1>

    <p v-if="connectedLoading" class="muted state-loading">Chargement…</p>
    <p v-else-if="connectedError" class="muted state-error">
      Impossible de charger tes parties pour le moment.
    </p>

    <div v-else class="accueil-layout">
      <div class="accueil-main">
        <router-link class="btn primary accueil-cta" to="/jeux">+ Nouvelle partie</router-link>

        <template v-if="recentGames.length">
          <span class="label">Jeux récents</span>
          <div class="accueil-recent-games">
            <router-link
              v-for="game in recentGames"
              :key="game.slug"
              class="tile"
              :to="{ name: 'nouvelle-partie', params: { slug: game.slug } }"
            >
              <div
                class="ph accueil-tile-thumb"
                :style="{ background: game.color }"
                aria-hidden="true"
              ></div>
              <strong>{{ game.name }}</strong>
              <span class="muted">{{ formatDateShort(game.playedAt) }}</span>
            </router-link>
          </div>
        </template>
      </div>

      <div class="accueil-side">
        <div class="row">
          <span class="label">Dernières parties</span>
          <router-link to="/historique">Historique</router-link>
        </div>
        <p v-if="recentMatches.length === 0" class="muted state-empty">
          Aucune partie enregistrée pour l'instant.
        </p>
        <div v-else class="accueil-matches">
          <router-link
            v-for="match in recentMatches"
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
              <span class="muted"
                >{{ playersCountLabel(match) }} · {{ winnersSummary(match) }}</span
              >
            </span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="accueil-quicklinks">
      <router-link class="btn" to="/joueurs">Mes joueurs</router-link>
      <router-link class="btn" to="/jeux">Catalogue</router-link>
    </div>
  </div>

  <div v-else class="accueil-visiteur">
    <div class="hero" aria-hidden="true">
      <span class="hero-card hero-card--1"></span>
      <span class="hero-card hero-card--2"></span>
      <span class="hero-card hero-card--3"></span>
    </div>

    <h1 class="h1">Le carnet de scores de vos soirées jeux</h1>
    <p class="muted">
      Notez chaque partie, voyez qui gagne le plus, et revoyez toutes les feuilles de score.
    </p>
    <button class="btn primary accueil-connect-btn" type="button" @click="signInWithGoogle">
      Se connecter avec Google
    </button>
    <p class="muted">Seul celui qui tient le carnet a besoin d'un compte.</p>

    <div class="accueil-games-section">
      <div class="row">
        <span class="label">Jeux disponibles</span>
        <router-link to="/jeux">Tout voir</router-link>
      </div>
      <p v-if="featuredLoading" class="muted state-loading">Chargement…</p>
      <p v-else-if="featuredError" class="muted state-error">
        Impossible de charger le catalogue pour le moment.
      </p>
      <div v-else class="accueil-games">
        <router-link
          v-for="game in featuredGames"
          :key="game.slug"
          class="box"
          :to="{ name: 'jeu', params: { slug: game.slug } }"
        >
          <div
            class="ph accueil-game-thumb"
            :style="{ background: game.color }"
            aria-hidden="true"
          ></div>
          <strong>{{ game.name }}</strong>
          <span class="tag">{{ playersLabel(game) }}</span>
        </router-link>
        <router-link class="box" to="/jeux">
          <div class="ph accueil-game-thumb" aria-hidden="true"></div>
          <strong>Autres jeux</strong>
          <span class="tag">feuille simple</span>
        </router-link>
      </div>
    </div>

    <div class="note">
      Visiteur : le catalogue et les pages de jeu sont consultables sans compte.
    </div>
  </div>
</template>
