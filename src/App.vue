<script setup></script>

<template>
  <div class="app">
    <div class="topbar">
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
      <router-view />
    </main>
  </div>
</template>
