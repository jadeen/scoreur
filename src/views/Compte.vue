<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { signOut, user, userDisplayName } from "../lib/auth";
import { supabase } from "../lib/supabase";

const router = useRouter();

const confirmingDelete = ref(false);
const deleting = ref(false);
const deleteError = ref(null);

async function deleteAccount() {
  deleting.value = true;
  deleteError.value = null;
  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    deleting.value = false;
    deleteError.value = "Impossible de supprimer ton compte pour le moment.";
    return;
  }
  await signOut();
  router.push("/");
}
</script>

<template>
  <div>
    <h1 class="h1">Mon compte</h1>

    <div class="note alpha-account-note">
      Version alpha : ton carnet (joueurs, parties) sera remis à zéro au passage en version 1.0.
    </div>

    <div v-if="!user" class="note connect-note">
      Connecte-toi avec Google pour gérer ton compte.
    </div>

    <div v-else class="compte-layout">
      <div class="who">
        <span class="avatar" aria-hidden="true">{{
          userDisplayName(user).charAt(0).toUpperCase()
        }}</span>
        <div class="t">
          <strong>{{ userDisplayName(user) }}</strong>
          <span class="muted">Connecté avec Google · {{ user.email }}</span>
        </div>
      </div>
      <button class="btn" type="button" @click="signOut">Se déconnecter</button>

      <div class="compte-links">
        <router-link to="/joueurs">Mes joueurs<span aria-hidden="true">›</span></router-link>
        <router-link to="/mentions-legales"
          >Mentions légales<span aria-hidden="true">›</span></router-link
        >
        <router-link to="/confidentialite"
          >Politique de confidentialité<span aria-hidden="true">›</span></router-link
        >
      </div>

      <div class="compte-danger">
        <h2 class="h2">Supprimer mon compte</h2>
        <p class="muted">
          Supprime définitivement ton carnet, tes joueurs, tes parties et tes propositions.
        </p>

        <button
          v-if="!confirmingDelete"
          class="btn red"
          type="button"
          @click="confirmingDelete = true"
        >
          Supprimer mon compte
        </button>
        <div v-else class="confirm-delete">
          <p class="muted">Supprimer définitivement ton compte ?</p>
          <p v-if="deleteError" class="muted error-delete">{{ deleteError }}</p>
          <div class="confirm-delete-actions">
            <button
              class="btn"
              type="button"
              :disabled="deleting"
              @click="confirmingDelete = false"
            >
              Annuler
            </button>
            <button class="btn red" type="button" :disabled="deleting" @click="deleteAccount">
              {{ deleting ? "Suppression…" : "Supprimer" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
