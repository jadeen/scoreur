<script setup>
const navLinks = [
  { label: 'Accueil', active: true },
  { label: 'Jeux', active: false },
  { label: 'Mes joueurs', active: false },
  { label: 'Proposer un jeu', active: false },
];
</script>

<template>
  <div class="app">
    <div class="topbar">
      <a class="logo" href="/">Scoreur</a>
      <a class="btn sm" href="#">Se connecter</a>
    </div>
    <nav class="desktop-nav">
      <div class="desktop-nav__inner">
        <a class="logo" href="/">Scoreur</a>
        <a
          v-for="link in navLinks"
          :key="link.label"
          class="link"
          :class="{ on: link.active }"
          href="#"
          >{{ link.label }}</a
        >
      </div>
    </nav>
    <main class="main">
      <h1 class="h1">Le carnet de scores de vos soirées jeux</h1>
      <p class="muted">Notez chaque partie, voyez qui gagne le plus, et revoyez toutes les feuilles de score.</p>
      <div class="note">Catalogue, connexion et parties arrivent dans les prochaines étapes.</div>
    </main>
  </div>
</template>
