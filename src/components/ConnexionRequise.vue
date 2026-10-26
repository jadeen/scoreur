<script setup>
import Introuvable from "./Introuvable.vue";
import { signInWithGoogle } from "../lib/auth";

defineProps({
  title: { type: String, required: true },
  message: { type: String, required: true },
});
</script>

<template>
  <Introuvable eyebrow="Connexion requise" :title="title" :message="message">
    <template #actions>
      <button class="btn primary" type="button" @click="signInWithGoogle">Se connecter</button>
      <router-link class="btn" to="/">Retour à l'accueil</router-link>
    </template>
  </Introuvable>
</template>
