<script setup>
import { useRoute } from "vue-router";

const route = useRoute();
</script>

<template>
  <div class="app">
    <div v-if="route.meta.back" class="topbar topbar--back">
      <router-link class="back-link" :to="route.meta.back.to"
        >‹ {{ route.meta.back.label }}</router-link
      >
      <router-link class="logo" to="/">Scoreur</router-link>
      <span class="topbar__spacer" aria-hidden="true"></span>
    </div>
    <div v-else class="topbar">
      <router-link class="logo" to="/">Scoreur</router-link>
      <a class="btn sm" href="#">Se connecter</a>
    </div>
    <nav class="desktop-nav">
      <div class="desktop-nav__inner">
        <router-link class="logo" to="/">Scoreur</router-link>
        <router-link class="link" active-class="on" to="/">Accueil</router-link>
        <router-link class="link" active-class="on" to="/jeux">Jeux</router-link>
        <a class="link" href="#">Mes joueurs</a>
        <a class="link" href="#">Proposer un jeu</a>
      </div>
    </nav>
    <main class="main">
      <router-link v-if="route.meta.back" class="back-link back-link--page" :to="route.meta.back.to"
        >‹ {{ route.meta.back.label }}</router-link
      >
      <router-view />
    </main>
  </div>
</template>
