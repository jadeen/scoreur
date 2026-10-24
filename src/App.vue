<script setup>
import { useRoute } from "vue-router";
import { signInWithGoogle, signOut, user, userDisplayName } from "./lib/auth";

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
      <div v-if="user" class="who">
        <span class="avatar" aria-hidden="true">{{
          userDisplayName(user).charAt(0).toUpperCase()
        }}</span>
        <span class="who__name">{{ userDisplayName(user) }}</span>
        <button class="link-btn" type="button" @click="signOut">Se déconnecter</button>
      </div>
      <button v-else class="btn sm" type="button" @click="signInWithGoogle">Se connecter</button>
    </div>
    <nav class="desktop-nav">
      <div class="desktop-nav__inner">
        <router-link class="logo" to="/">Scoreur</router-link>
        <router-link class="link" active-class="on" to="/">Accueil</router-link>
        <router-link class="link" active-class="on" to="/jeux">Jeux</router-link>
        <router-link class="link" active-class="on" to="/joueurs">Mes joueurs</router-link>
        <a class="link" href="#">Proposer un jeu</a>
        <span class="desktop-nav__spacer"></span>
        <div v-if="user" class="who">
          <span class="avatar" aria-hidden="true">{{
            userDisplayName(user).charAt(0).toUpperCase()
          }}</span>
          <span class="who__name">{{ userDisplayName(user) }}</span>
          <button class="link-btn" type="button" @click="signOut">Se déconnecter</button>
        </div>
        <button v-else class="btn sm" type="button" @click="signInWithGoogle">Se connecter</button>
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
