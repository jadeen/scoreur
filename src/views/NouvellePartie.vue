<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import BandeauFin from "../components/BandeauFin.vue";
import Classement from "../components/Classement.vue";
import FeuilleWizard from "../components/FeuilleWizard.vue";
import Stepper from "../components/Stepper.vue";
import { user } from "../lib/auth";
import { clearDraft, loadDraft, saveDraft } from "../lib/draft";
import { playersLabel } from "../lib/playersLabel";
import { rankPlayers } from "../lib/ranking";
import { supabase } from "../lib/supabase";
import { wizardRoundCount } from "../lib/wizardScoring";

const props = defineProps({
  slug: { type: String, required: true },
});

const router = useRouter();

const game = ref(null);
const gameLoading = ref(true);
const gameNotFound = ref(false);

const players = ref([]);
const playersLoading = ref(true);
const playersError = ref(false);

const step = ref("config");
const selected = ref([]);
const scores = reactive({});
const variant = ref(false);
const details = ref(null);

const isWizard = computed(() => game.value?.sheet === "wizard-v1");

const newName = ref("");
const addError = ref(null);
const saveError = ref(null);
const saving = ref(false);

function friendlyError(error) {
  if (error.code === "23505") return "Ce nom existe déjà dans ton carnet.";
  return "Impossible d'enregistrer pour le moment.";
}

async function loadGame() {
  gameLoading.value = true;
  gameNotFound.value = false;
  const { data } = await supabase.from("games").select("*").eq("slug", props.slug).maybeSingle();
  game.value = data;
  gameNotFound.value = !data;
  gameLoading.value = false;
}

function sortedPlayers() {
  return [...players.value].sort((a, b) => Number(b.is_me) - Number(a.is_me));
}

function restoreDraft() {
  const draft = loadDraft(props.slug);
  if (!draft) return false;
  const validIds = new Set(players.value.map((player) => player.id));
  const ids = draft.playerIds.filter((id) => validIds.has(id));
  if (ids.length === 0) return false;

  selected.value = ids;
  for (const id of ids) scores[id] = draft.scores[id];
  if (draft.details) {
    details.value = draft.details;
    variant.value = Boolean(draft.details.variante_pas_egal);
  }
  step.value = "feuille";
  return true;
}

async function loadPlayers() {
  playersLoading.value = true;
  playersError.value = false;
  const { data, error } = await supabase.from("players").select("*").order("name");
  playersLoading.value = false;
  if (error) {
    playersError.value = true;
    return;
  }

  players.value = data;
  if (!restoreDraft()) {
    const me = players.value.find((player) => player.is_me);
    if (me) selected.value = [me.id];
  }
}

watch(
  user,
  (current) => {
    if (current) {
      loadPlayers();
    } else {
      players.value = [];
      playersLoading.value = false;
    }
  },
  { immediate: true },
);

onMounted(loadGame);

function isSelected(id) {
  return selected.value.includes(id);
}

function toggleSelected(id) {
  selected.value = isSelected(id)
    ? selected.value.filter((selectedId) => selectedId !== id)
    : [...selected.value, id];
}

async function addPlayer() {
  const name = newName.value.trim();
  if (!name) return;
  addError.value = null;
  const { data, error } = await supabase.from("players").insert({ name }).select().single();
  if (error) {
    addError.value = friendlyError(error);
    return;
  }
  players.value = [...players.value, data];
  selected.value = [...selected.value, data.id];
  newName.value = "";
}

const canStart = computed(
  () =>
    game.value &&
    selected.value.length >= game.value.players_min &&
    selected.value.length <= game.value.players_max,
);

function persistDraft() {
  saveDraft(props.slug, {
    playerIds: selected.value,
    scores: { ...scores },
    details: details.value,
  });
}

watch(scores, persistDraft, { deep: true });
watch(details, persistDraft, { deep: true });

function onWizardScores(wizardScores) {
  Object.assign(scores, wizardScores);
}

function onWizardDetails(wizardDetails) {
  details.value = wizardDetails;
}

function startGame() {
  for (const id of selected.value) scores[id] = 0;
  step.value = "feuille";
}

const feuillePlayers = computed(() =>
  selected.value.map((id) => {
    const player = players.value.find((candidate) => candidate.id === id);
    return { id, name: player.name, score: scores[id] };
  }),
);

async function onSave(noteText) {
  saving.value = true;
  saveError.value = null;
  const ranked = rankPlayers(feuillePlayers.value, game.value.lower_wins);
  const { error } = await supabase.rpc("save_match", {
    p_game_id: game.value.id,
    p_players: ranked.map((player) => ({
      player_id: player.id,
      score: player.score,
      rank: player.rank,
      is_winner: player.isWinner,
    })),
    p_notes: noteText.trim() || null,
    ...(details.value ? { p_details: details.value, p_details_format: game.value.sheet } : {}),
  });
  saving.value = false;
  if (error) {
    saveError.value = "Impossible d'enregistrer la partie pour le moment.";
    return;
  }
  clearDraft(props.slug);
  router.push(`/jeu/${props.slug}`);
}

function onAbandon() {
  clearDraft(props.slug);
  router.push(`/jeu/${props.slug}`);
}
</script>

<template>
  <div>
    <p v-if="gameLoading" class="muted">Chargement…</p>
    <p v-else-if="gameNotFound" class="muted">Ce jeu n'existe pas.</p>
    <div v-else-if="!user" class="note connect-note">
      Connecte-toi avec Google pour enregistrer une partie.
    </div>
    <p v-else-if="playersLoading" class="muted">Chargement du carnet…</p>
    <p v-else-if="playersError" class="muted">Impossible de charger ton carnet pour le moment.</p>

    <div v-else class="partie-layout">
      <div class="partie-head">
        <router-link v-if="step === 'config'" class="back-link" :to="`/jeu/${slug}`"
          >‹ Annuler</router-link
        >
        <router-link v-else-if="step === 'feuille'" class="back-link" :to="`/jeu/${slug}`"
          >‹ Quitter</router-link
        >
        <a v-else class="back-link" href="#" @click.prevent="step = 'feuille'">‹ Feuille</a>
      </div>

      <h1 class="h1">
        {{ step === "fin" ? "Fin de partie" : `Nouvelle partie de ${game.name}` }}
      </h1>

      <div v-if="step === 'config'" class="config-step">
        <h2 class="h2">Joueurs</h2>
        <p class="muted">Coche les joueurs du carnet · {{ playersLabel(game) }}</p>

        <label
          v-for="player in sortedPlayers()"
          :key="player.id"
          class="pl"
          :class="{ off: !isSelected(player.id) }"
        >
          <input
            type="checkbox"
            :checked="isSelected(player.id)"
            @change="toggleSelected(player.id)"
          />
          {{ player.name }}<span v-if="player.is_me" class="badge">moi</span>
        </label>

        <form class="add" @submit.prevent="addPlayer">
          <input
            v-model="newName"
            type="text"
            aria-label="Nouveau joueur"
            placeholder="Ajouter un joueur au carnet"
          />
          <button class="btn" type="submit">Ajouter</button>
        </form>
        <p v-if="addError" class="muted error-add">{{ addError }}</p>

        <div v-if="isWizard" class="box">
          <h2 class="h2">Options du jeu</h2>
          <label class="check">
            <input v-model="variant" type="checkbox" />
            <span>Variante : le total des annonces ne peut pas égaler le nombre de plis</span>
          </label>
          <p v-if="selected.length" class="muted">
            {{ selected.length }} joueur{{ selected.length > 1 ? "s" : "" }} ·
            {{ wizardRoundCount(selected.length) }} manches
          </p>
        </div>

        <p v-if="!canStart" class="muted hint-count">
          {{ playersLabel(game) }} nécessaires pour commencer.
        </p>
        <button class="btn primary" type="button" :disabled="!canStart" @click="startGame">
          Commencer la partie
        </button>
      </div>

      <div
        v-else-if="step === 'feuille'"
        class="feuille-step"
        :class="{ 'feuille-step--wizard': isWizard }"
      >
        <Classement :players="feuillePlayers" :lower-wins="game.lower_wins" />

        <template v-if="isWizard">
          <FeuilleWizard
            :players="feuillePlayers"
            :variant="variant"
            :initial-details="details"
            @update:scores="onWizardScores"
            @update:details="onWizardDetails"
            @fin="step = 'fin'"
          />
          <button class="btn" type="button" @click="onAbandon">Abandonner la partie</button>
        </template>

        <div v-else class="hand">
          <h2 class="h2">Scores</h2>
          <div v-for="player in feuillePlayers" :key="player.id" class="pr">
            <span>{{ player.name }}</span>
            <Stepper
              :model-value="scores[player.id]"
              @update:model-value="(value) => (scores[player.id] = value)"
            />
          </div>
          <button class="btn primary" type="button" @click="step = 'fin'">
            Terminer la partie
          </button>
        </div>
      </div>

      <div v-else class="fin-step">
        <BandeauFin
          :players="feuillePlayers"
          :lower-wins="game.lower_wins"
          :saving="saving"
          @save="onSave"
          @abandon="onAbandon"
        />
        <p v-if="saveError" class="muted error-save">{{ saveError }}</p>
      </div>
    </div>
  </div>
</template>
