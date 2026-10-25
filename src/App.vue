<script setup>
import { ref } from "vue";
import { useRoute } from "vue-router";
import { signInWithGoogle, user, userDisplayName } from "./lib/auth";
import { dismissAlphaBanner, isAlphaBannerDismissed } from "./lib/alphaBanner";

const route = useRoute();
const bannerDismissed = ref(isAlphaBannerDismissed());

function hideBanner() {
  dismissAlphaBanner();
  bannerDismissed.value = true;
}
</script>

<template>
  <div class="app">
    <div v-if="!bannerDismissed" class="alpha-banner">
      <span
        >Version alpha · les données seront réinitialisées à la 1.0
        <router-link to="/compte">en savoir plus</router-link></span
      >
      <button
        class="alpha-banner__close"
        type="button"
        aria-label="Masquer le bandeau"
        @click="hideBanner"
      >
        ×
      </button>
    </div>
    <div v-if="route.meta.back" class="topbar topbar--back">
      <router-link class="back-link" :to="route.meta.back.to"
        >‹ {{ route.meta.back.label }}</router-link
      >
      <router-link class="logo" to="/">Scoreur</router-link>
      <span class="topbar__spacer" aria-hidden="true"></span>
    </div>
    <div v-else class="topbar">
      <router-link class="logo" to="/">Scoreur</router-link>
      <router-link v-if="user" class="who" to="/compte" aria-label="Mon compte">
        <span class="avatar" aria-hidden="true">{{
          userDisplayName(user).charAt(0).toUpperCase()
        }}</span>
      </router-link>
      <button v-else class="btn sm" type="button" @click="signInWithGoogle">Se connecter</button>
    </div>
    <nav class="desktop-nav">
      <div class="desktop-nav__inner">
        <router-link class="logo" to="/">Scoreur</router-link>
        <router-link class="link" active-class="on" to="/">Accueil</router-link>
        <router-link class="link" active-class="on" to="/jeux">Jeux</router-link>
        <router-link class="link" active-class="on" to="/joueurs">Mes joueurs</router-link>
        <router-link class="link" active-class="on" to="/historique">Historique</router-link>
        <a class="link" href="#">Proposer un jeu</a>
        <span class="desktop-nav__spacer"></span>
        <router-link v-if="user" class="who" to="/compte" aria-label="Mon compte">
          <span class="avatar" aria-hidden="true">{{
            userDisplayName(user).charAt(0).toUpperCase()
          }}</span>
        </router-link>
        <button v-else class="btn sm" type="button" @click="signInWithGoogle">Se connecter</button>
      </div>
    </nav>
    <main class="main">
      <router-link v-if="route.meta.back" class="back-link back-link--page" :to="route.meta.back.to"
        >‹ {{ route.meta.back.label }}</router-link
      >
      <router-view />
    </main>
    <footer class="footer">
      <router-link to="/mentions-legales">Mentions légales</router-link>
      <router-link to="/confidentialite">Politique de confidentialité</router-link>
    </footer>
  </div>
</template>
