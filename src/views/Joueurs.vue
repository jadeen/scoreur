<script setup>
import { ref, watch } from "vue";
import { user } from "../lib/auth";
import { supabase } from "../lib/supabase";

const players = ref([]);
const loading = ref(true);
const loadError = ref(null);

const newName = ref("");
const addError = ref(null);

const renamingId = ref(null);
const renameValue = ref("");
const renameError = ref(null);

const moiError = ref(null);

function friendlyError(error) {
  if (error.code === "23505") return "Ce nom existe déjà dans ton carnet.";
  return "Impossible d'enregistrer pour le moment.";
}

async function loadPlayers() {
  loading.value = true;
  loadError.value = null;
  const { data, error } = await supabase.from("players").select("*").order("name");
  if (error) {
    loadError.value = error.message;
  } else {
    players.value = data;
  }
  loading.value = false;
}

watch(
  user,
  (current) => {
    if (current) {
      loadPlayers();
    } else {
      players.value = [];
      loading.value = false;
    }
  },
  { immediate: true },
);

// « moi » en tête, le reste dans l'ordre alphabétique déjà renvoyé par la requête
// (Array#sort est stable, l'ordre relatif des autres joueurs est conservé).
function sortedPlayers() {
  return [...players.value].sort((a, b) => Number(b.is_me) - Number(a.is_me));
}

async function addPlayer() {
  const name = newName.value.trim();
  if (!name) return;
  addError.value = null;
  const { error } = await supabase.from("players").insert({ name });
  if (error) {
    addError.value = friendlyError(error);
    return;
  }
  newName.value = "";
  await loadPlayers();
}

function startRename(player) {
  renamingId.value = player.id;
  renameValue.value = player.name;
  renameError.value = null;
}

function cancelRename() {
  renamingId.value = null;
  renameError.value = null;
}

async function saveRename(player) {
  const name = renameValue.value.trim();
  if (!name) return;
  renameError.value = null;
  const { error } = await supabase.from("players").update({ name }).eq("id", player.id);
  if (error) {
    renameError.value = friendlyError(error);
    return;
  }
  player.name = name;
  renamingId.value = null;
}

async function markAsMoi(player) {
  moiError.value = null;
  const previous = players.value.find((p) => p.is_me && p.id !== player.id);
  if (previous) {
    const { error } = await supabase.from("players").update({ is_me: false }).eq("id", previous.id);
    if (error) {
      moiError.value = friendlyError(error);
      return;
    }
  }
  const { error } = await supabase.from("players").update({ is_me: true }).eq("id", player.id);
  if (error) {
    moiError.value = friendlyError(error);
    return;
  }
  if (previous) previous.is_me = false;
  player.is_me = true;
}
</script>

<template>
  <div>
    <h1 class="h1">Mes joueurs</h1>
    <p class="muted">Les joueurs n'ont pas de compte : ce sont des noms dans ton carnet.</p>

    <div v-if="!user" class="note">Connecte-toi avec Google pour gérer ton carnet de joueurs.</div>

    <template v-else>
      <form class="add" @submit.prevent="addPlayer">
        <input
          v-model="newName"
          type="text"
          aria-label="Nom du joueur"
          placeholder="Prénom ou pseudo"
          required
        />
        <button class="btn" type="submit">Ajouter</button>
      </form>
      <p v-if="addError" class="muted error-add">{{ addError }}</p>

      <p v-if="loading" class="muted state-loading">Chargement du carnet…</p>
      <p v-else-if="loadError" class="muted state-error">
        Impossible de charger ton carnet pour le moment.
      </p>
      <p v-else-if="sortedPlayers().length === 0" class="muted state-empty">
        Ton carnet est vide pour l'instant.
      </p>

      <div v-else class="player-list">
        <div v-for="player in sortedPlayers()" :key="player.id" class="item player-item">
          <span class="avatar" aria-hidden="true">{{ player.name.charAt(0).toUpperCase() }}</span>

          <div class="t">
            <form
              v-if="renamingId === player.id"
              class="rename"
              @submit.prevent="saveRename(player)"
            >
              <input
                v-model="renameValue"
                type="text"
                aria-label="Nouveau nom du joueur"
                required
              />
              <button class="lk" type="submit">Enregistrer</button>
              <button class="lk" type="button" @click="cancelRename">Annuler</button>
            </form>
            <strong v-else
              >{{ player.name }}<span v-if="player.is_me" class="badge">moi</span></strong
            >
            <p v-if="renamingId === player.id && renameError" class="muted error-rename">
              {{ renameError }}
            </p>
          </div>

          <div v-if="renamingId !== player.id" class="actions">
            <button class="lk" type="button" @click="startRename(player)">Renommer</button>
            <button v-if="!player.is_me" class="lk" type="button" @click="markAsMoi(player)">
              Marquer comme moi
            </button>
          </div>
        </div>
      </div>
      <p v-if="moiError" class="muted error-moi">{{ moiError }}</p>
    </template>
  </div>
</template>
