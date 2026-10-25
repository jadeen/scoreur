import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import FeuilleBingo from "../components/FeuilleBingo.vue";
import FeuilleOdin from "../components/FeuilleOdin.vue";
import FeuilleWizard from "../components/FeuilleWizard.vue";
import { loadDraft, saveDraft } from "../lib/draft";
import { user } from "../lib/auth";
import { supabase } from "../lib/supabase";
import { router } from "../router";
import NouvellePartie from "./NouvellePartie.vue";

vi.mock("../lib/auth", async () => {
  const { ref } = await import("vue");
  return { user: ref(null) };
});

vi.mock("../lib/supabase", () => ({
  supabase: { from: vi.fn(), rpc: vi.fn() },
}));

function makeGame(overrides = {}) {
  return {
    id: 10,
    slug: "wizard",
    name: "Wizard",
    players_min: 1,
    players_max: 6,
    lower_wins: false,
    ...overrides,
  };
}

function makePlayers() {
  return [
    { id: 1, name: "Hugo", is_me: false },
    { id: 2, name: "Léa", is_me: false },
    { id: 3, name: "Moi", is_me: true },
  ];
}

function mockTables({
  game,
  players = [],
  playersError,
  insertedPlayer,
  insertError,
  playersPending,
} = {}) {
  supabase.from.mockImplementation((table) => {
    if (table === "games") {
      return {
        select: () => ({
          eq: () => ({ maybeSingle: () => Promise.resolve({ data: game ?? null, error: null }) }),
        }),
      };
    }
    return {
      select: () => ({
        order: () => {
          if (playersPending) return new Promise(() => {});
          return Promise.resolve(
            playersError ? { data: null, error: playersError } : { data: players, error: null },
          );
        },
      }),
      insert: vi.fn(() => ({
        select: () => ({
          single: () =>
            Promise.resolve(
              insertError
                ? { data: null, error: insertError }
                : { data: insertedPlayer, error: null },
            ),
        }),
      })),
    };
  });
}

let wrapper;

function mountPartie(props = { slug: "wizard" }) {
  wrapper = mount(NouvellePartie, { props, global: { plugins: [router] } });
  return wrapper;
}

describe("NouvellePartie", () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.clearAllMocks();
    user.value = null;
    localStorage.clear();
  });

  it("invite à se connecter une fois le jeu chargé", async () => {
    mockTables({ game: makeGame() });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".note").text()).toBe(
      "Connecte-toi avec Google pour enregistrer une partie.",
    );
  });

  it("affiche un message quand le jeu n'existe pas", async () => {
    mockTables({ game: null });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe("Ce jeu n'existe pas.");
  });

  it("ne présélectionne personne si le carnet n'a pas de « moi »", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame(),
      players: [
        { id: 1, name: "Hugo", is_me: false },
        { id: 2, name: "Léa", is_me: false },
      ],
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    for (const input of wrapper.findAll(".pl input")) {
      expect(input.element.checked).toBe(false);
    }
  });

  it("affiche un message d'erreur si le chargement du carnet échoue", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), playersError: { message: "boom" } });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe("Impossible de charger ton carnet pour le moment.");
  });

  it("affiche un état de chargement du carnet une fois connecté", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers(), playersPending: true });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe("Chargement du carnet…");
  });

  it("présélectionne « moi » et affiche les joueurs du carnet à cocher", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    const rows = wrapper.findAll(".pl");
    expect(rows.map((row) => row.text().replace("moi", ""))).toEqual(["Moi", "Hugo", "Léa"]);
    expect(rows[0].find("input").element.checked).toBe(true);
    expect(rows[1].find("input").element.checked).toBe(false);
    expect(rows[1].classes()).toContain("off");
  });

  it("désactive « Commencer la partie » sous le minimum de joueurs", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame({ players_min: 3, players_max: 6 }), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    expect(wrapper.find(".hint-count").exists()).toBe(true);
    expect(wrapper.find(".btn.primary").attributes("disabled")).toBeDefined();
  });

  it("active « Commencer la partie » dans la fourchette de joueurs", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame({ players_min: 3, players_max: 6 }), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.findAll(".pl input")[1].trigger("change");
    await wrapper.findAll(".pl input")[2].trigger("change");

    expect(wrapper.find(".hint-count").exists()).toBe(false);
    expect(wrapper.find(".btn.primary").attributes("disabled")).toBeUndefined();
  });

  it("redésactive « Commencer la partie » au-dessus du maximum de joueurs", async () => {
    user.value = { email: "lea@example.fr" };
    const players = [
      ...makePlayers(),
      { id: 4, name: "Inès", is_me: false },
      { id: 5, name: "Tom", is_me: false },
      { id: 6, name: "Zoé", is_me: false },
      { id: 7, name: "Ana", is_me: false },
    ];
    mockTables({ game: makeGame({ players_min: 3, players_max: 6 }), players });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    for (const input of wrapper.findAll(".pl input")) {
      if (!input.element.checked) await input.trigger("change");
    }

    expect(wrapper.find(".hint-count").exists()).toBe(true);
    expect(wrapper.find(".btn.primary").attributes("disabled")).toBeDefined();
  });

  it("ajoute un joueur depuis la configuration et le présélectionne", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame(),
      players: makePlayers(),
      insertedPlayer: { id: 4, name: "Tom", is_me: false },
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.find('input[aria-label="Nouveau joueur"]').setValue("Tom");
    await wrapper.find(".add").trigger("submit");
    await flushPromises();

    const rows = wrapper.findAll(".pl");
    expect(rows).toHaveLength(4);
    const tomRow = rows.find((row) => row.text().startsWith("Tom"));
    expect(tomRow.find("input").element.checked).toBe(true);
  });

  it("affiche un message d'erreur si l'ajout de joueur échoue (nom déjà pris)", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers(), insertError: { code: "23505" } });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.find('input[aria-label="Nouveau joueur"]').setValue("Léa");
    await wrapper.find(".add").trigger("submit");
    await flushPromises();

    expect(wrapper.find(".error-add").text()).toBe("Ce nom existe déjà dans ton carnet.");
  });

  it("affiche un message générique si l'ajout de joueur échoue pour une autre raison", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers(), insertError: { code: "500" } });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.find('input[aria-label="Nouveau joueur"]').setValue("Tom");
    await wrapper.find(".add").trigger("submit");
    await flushPromises();

    expect(wrapper.find(".error-add").text()).toBe("Impossible d'enregistrer pour le moment.");
  });

  it("décoche un joueur déjà sélectionné", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    const moiInput = wrapper.findAll(".pl input")[0];
    expect(moiInput.element.checked).toBe(true);
    await moiInput.trigger("change");

    expect(wrapper.findAll(".pl")[0].classes()).toContain("off");
    expect(wrapper.find(".hint-count").exists()).toBe(true);
  });

  it("ne tente pas d'ajouter un nom vide", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();
    supabase.from.mockClear();

    const input = wrapper.find('input[aria-label="Nouveau joueur"]');
    input.element.value = "   ";
    await input.trigger("input");
    await wrapper.find(".add").trigger("submit");
    await flushPromises();

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("démarre la partie, permet d'ajuster les scores et enregistre le brouillon", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.findAll(".pl input")[1].trigger("change");
    await wrapper.findAll(".pl input")[2].trigger("change");
    await wrapper.find(".btn.primary").trigger("click");

    expect(wrapper.find(".feuille-step").exists()).toBe(true);
    expect(wrapper.findAll(".st")).toHaveLength(3);
    expect(wrapper.findAll(".pr")).toHaveLength(3);

    await wrapper.findAll('button[aria-label="Plus"]')[0].trigger("click");

    const draft = loadDraft("wizard");
    expect(Object.values(draft.scores).reduce((a, b) => a + b, 0)).toBe(1);
  });

  it("reprend un brouillon existant et ignore les joueurs qui n'existent plus", async () => {
    user.value = { email: "lea@example.fr" };
    saveDraft("wizard", { playerIds: [3, 999], scores: { 3: 5, 999: 2 } });
    mockTables({ game: makeGame(), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    expect(wrapper.find(".feuille-step").exists()).toBe(true);
    const cards = wrapper.findAll(".st");
    expect(cards).toHaveLength(1);
    expect(cards[0].find("b").text()).toBe("5");
  });

  it("revient à la configuration par défaut si le brouillon ne référence plus aucun joueur valide", async () => {
    user.value = { email: "lea@example.fr" };
    saveDraft("wizard", { playerIds: [999], scores: { 999: 2 } });
    mockTables({ game: makeGame(), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    expect(wrapper.find(".config-step").exists()).toBe(true);
  });

  it("quitte sans perdre le brouillon via « Quitter »", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.find(".btn.primary").trigger("click");
    expect(wrapper.find(".back-link").text()).toBe("‹ Quitter");

    await wrapper.find(".back-link").trigger("click");
    await flushPromises();
    expect(loadDraft("wizard")).not.toBeNull();
  });

  it("termine la partie, revient à la feuille via « Feuille » puis repart en fin", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.find(".btn.primary").trigger("click"); // commence (moi seul)
    await wrapper.find(".hand .btn.primary").trigger("click"); // termine

    expect(wrapper.find(".fin-step").exists()).toBe(true);
    expect(wrapper.find("h1.h1").text()).toBe("Fin de partie");
    expect(wrapper.find(".back-link").text()).toBe("‹ Feuille");

    await wrapper.find(".back-link").trigger("click");
    expect(wrapper.find(".feuille-step").exists()).toBe(true);
  });

  it("enregistre la partie puis efface le brouillon et revient à la page du jeu", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame({ lower_wins: true }), players: makePlayers() });
    supabase.rpc.mockResolvedValue({ error: null });
    const wrapper = mountPartie();
    await router.push("/jeu/wizard/partie");
    await flushPromises();
    await flushPromises();

    await wrapper.findAll(".pl input")[1].trigger("change");
    await wrapper.find(".btn.primary").trigger("click");
    await wrapper.findAll('button[aria-label="Plus"]')[0].trigger("click");
    await wrapper.find(".hand .btn.primary").trigger("click");
    await wrapper.find("#notes-fin").setValue("chez Hugo");
    await wrapper.find(".bandeau-fin .btn.primary").trigger("click");
    await flushPromises();

    expect(supabase.rpc).toHaveBeenCalledWith("save_match", {
      p_game_id: 10,
      p_players: expect.arrayContaining([
        expect.objectContaining({ player_id: 1, score: 0, rank: 1, is_winner: true }),
        expect.objectContaining({ player_id: 3, score: 1, rank: 2, is_winner: false }),
      ]),
      p_notes: "chez Hugo",
    });
    expect(loadDraft("wizard")).toBeNull();
    expect(router.currentRoute.value.path).toBe("/jeu/wizard");
  });

  it("affiche une erreur si l'enregistrement échoue et garde le brouillon", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers() });
    supabase.rpc.mockResolvedValue({ error: { message: "boom" } });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.find(".btn.primary").trigger("click");
    await wrapper.find(".hand .btn.primary").trigger("click");
    await wrapper.find(".bandeau-fin .btn.primary").trigger("click");
    await flushPromises();

    expect(wrapper.find(".error-save").text()).toBe(
      "Impossible d'enregistrer la partie pour le moment.",
    );
    expect(loadDraft("wizard")).not.toBeNull();
  });

  it("abandonne sans enregistrer : efface le brouillon et revient à la page du jeu", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers() });
    const wrapper = mountPartie();
    await router.push("/jeu/wizard/partie");
    await flushPromises();
    await flushPromises();

    await wrapper.find(".btn.primary").trigger("click");
    await wrapper.find(".hand .btn.primary").trigger("click");
    await wrapper.findAll(".bandeau-fin .btn")[1].trigger("click");
    await flushPromises();

    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(loadDraft("wizard")).toBeNull();
    expect(router.currentRoute.value.path).toBe("/jeu/wizard");
  });

  it("vide le carnet et revient à l'invite de connexion à la déconnexion", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({ game: makeGame(), players: makePlayers() });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();
    expect(wrapper.findAll(".pl")).toHaveLength(3);

    user.value = null;
    await flushPromises();

    expect(wrapper.find(".note").text()).toBe(
      "Connecte-toi avec Google pour enregistrer une partie.",
    );
  });

  it("affiche les options Wizard à la configuration", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "wizard-v1", players_min: 3, players_max: 6 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    expect(wrapper.find(".box .check span").text()).toBe(
      "Variante : le total des annonces ne peut pas égaler le nombre de plis",
    );
    expect(wrapper.find(".box .muted").text()).toBe("1 joueur · 60 manches");

    await wrapper.findAll(".pl input")[1].trigger("change");
    expect(wrapper.find(".box .muted").text()).toBe("2 joueurs · 30 manches");

    const variantCheckbox = wrapper.find(".box .check input");
    expect(variantCheckbox.element.checked).toBe(false);
    await variantCheckbox.setValue(true);
    expect(variantCheckbox.element.checked).toBe(true);
  });

  it("démarre une partie Wizard et affiche la feuille dédiée", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "wizard-v1", players_min: 3, players_max: 6 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.findAll(".pl input")[1].trigger("change");
    await wrapper.findAll(".pl input")[2].trigger("change");
    await wrapper.find(".btn.primary").trigger("click");

    expect(wrapper.find(".feuille-step").classes()).toContain("feuille-step--dedie");
    expect(wrapper.findComponent(FeuilleWizard).exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Terminer la partie");
  });

  it("abandonne une partie Wizard en cours : efface le brouillon et revient à la page du jeu", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "wizard-v1", players_min: 3, players_max: 6 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await router.push("/jeu/wizard/partie");
    await flushPromises();
    await flushPromises();

    await wrapper.findAll(".pl input")[1].trigger("change");
    await wrapper.findAll(".pl input")[2].trigger("change");
    await wrapper.find(".btn.primary").trigger("click");

    const feuille = wrapper.findComponent(FeuilleWizard);
    feuille.vm.$emit("update:details", {
      joueurs: [3, 1, 2],
      manches: [{ annonces: [0], plis: [0] }],
    });
    await flushPromises();
    expect(loadDraft("wizard")).not.toBeNull();

    const abandonButton = wrapper
      .findAll(".feuille-step .btn")
      .find((btn) => btn.text() === "Abandonner la partie");
    await abandonButton.trigger("click");
    await flushPromises();

    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(loadDraft("wizard")).toBeNull();
    expect(router.currentRoute.value.path).toBe("/jeu/wizard");
  });

  it("enregistre une partie Wizard avec le détail en wizard-v1 une fois la feuille terminée", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "wizard-v1", players_min: 3, players_max: 6 }),
      players: makePlayers(),
    });
    supabase.rpc.mockResolvedValue({ error: null });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.findAll(".pl input")[1].trigger("change");
    await wrapper.findAll(".pl input")[2].trigger("change");
    await wrapper.find(".btn.primary").trigger("click");

    const feuille = wrapper.findComponent(FeuilleWizard);
    const wizardDetails = {
      joueurs: [3, 1, 2],
      premier_donneur: 0,
      variante_pas_egal: false,
      manches: [{ annonces: [0, 0, 0], plis: [0, 0, 0] }],
    };
    feuille.vm.$emit("update:scores", { 3: 20, 1: 20, 2: 20 });
    feuille.vm.$emit("update:details", wizardDetails);
    feuille.vm.$emit("fin");
    await flushPromises();

    expect(wrapper.find(".fin-step").exists()).toBe(true);

    await wrapper.find(".bandeau-fin .btn.primary").trigger("click");
    await flushPromises();

    expect(supabase.rpc).toHaveBeenCalledWith("save_match", {
      p_game_id: 10,
      p_players: expect.arrayContaining([
        expect.objectContaining({ player_id: 3, score: 20 }),
        expect.objectContaining({ player_id: 1, score: 20 }),
        expect.objectContaining({ player_id: 2, score: 20 }),
      ]),
      p_notes: null,
      p_details: wizardDetails,
      p_details_format: "wizard-v1",
    });
  });

  it("reprend un brouillon Wizard avec ses manches et sa variante", async () => {
    user.value = { email: "lea@example.fr" };
    const wizardDetails = {
      joueurs: [3],
      premier_donneur: 0,
      variante_pas_egal: true,
      manches: [{ annonces: [0], plis: [0] }],
    };
    saveDraft("wizard", { playerIds: [3], scores: { 3: 20 }, details: wizardDetails });
    mockTables({
      game: makeGame({ sheet: "wizard-v1", players_min: 3, players_max: 6 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    const feuille = wrapper.findComponent(FeuilleWizard);
    expect(feuille.exists()).toBe(true);
    expect(feuille.props("initialDetails")).toEqual(wizardDetails);
    expect(feuille.props("variant")).toBe(true);
  });

  it("affiche les options Odin à la configuration, avec le seuil par défaut", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "odin-v1", players_min: 2, players_max: 6 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    const targetInput = wrapper.find(".target-field input");
    expect(targetInput.element.value).toBe("15");

    await targetInput.setValue("20");
    await targetInput.trigger("change");
    expect(targetInput.element.value).toBe("20");
  });

  it("ignore une valeur de seuil hors bornes et retombe sur une valeur valide", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "odin-v1", players_min: 2, players_max: 6 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    const targetInput = wrapper.find(".target-field input");
    await targetInput.setValue("1");
    await targetInput.trigger("change");
    expect(targetInput.element.value).toBe("5");

    await targetInput.setValue("500");
    await targetInput.trigger("change");
    expect(targetInput.element.value).toBe("200");

    await targetInput.setValue("");
    await targetInput.trigger("change");
    expect(targetInput.element.value).toBe("15");
  });

  it("démarre une partie Odin et affiche la feuille dédiée", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "odin-v1", players_min: 2, players_max: 6 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.findAll(".pl input")[1].trigger("change");
    await wrapper.find(".btn.primary").trigger("click");

    expect(wrapper.find(".feuille-step").classes()).toContain("feuille-step--dedie");
    expect(wrapper.findComponent(FeuilleOdin).exists()).toBe(true);
    expect(wrapper.text()).not.toContain("Terminer la partie");
  });

  it("enregistre une partie Odin avec le détail en odin-v1 une fois la feuille terminée", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "odin-v1", players_min: 2, players_max: 6 }),
      players: makePlayers(),
    });
    supabase.rpc.mockResolvedValue({ error: null });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await wrapper.findAll(".pl input")[1].trigger("change");
    await wrapper.find(".btn.primary").trigger("click");

    const feuille = wrapper.findComponent(FeuilleOdin);
    const odinDetails = { joueurs: [3, 1], seuil: 15, manches: [[0, 4]] };
    feuille.vm.$emit("update:scores", { 3: 0, 1: 4 });
    feuille.vm.$emit("update:details", odinDetails);
    feuille.vm.$emit("fin");
    await flushPromises();

    expect(wrapper.find(".fin-step").exists()).toBe(true);

    await wrapper.find(".bandeau-fin .btn.primary").trigger("click");
    await flushPromises();

    expect(supabase.rpc).toHaveBeenCalledWith("save_match", {
      p_game_id: 10,
      p_players: expect.arrayContaining([
        expect.objectContaining({ player_id: 3, score: 0 }),
        expect.objectContaining({ player_id: 1, score: 4 }),
      ]),
      p_notes: null,
      p_details: odinDetails,
      p_details_format: "odin-v1",
    });
  });

  it("reprend un brouillon Odin avec ses manches et son seuil", async () => {
    user.value = { email: "lea@example.fr" };
    const odinDetails = { joueurs: [3], seuil: 30, manches: [[2]] };
    saveDraft("wizard", { playerIds: [3], scores: { 3: 2 }, details: odinDetails });
    mockTables({
      game: makeGame({ sheet: "odin-v1", players_min: 2, players_max: 6 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    const feuille = wrapper.findComponent(FeuilleOdin);
    expect(feuille.exists()).toBe(true);
    expect(feuille.props("initialDetails")).toEqual(odinDetails);
    expect(feuille.props("target")).toBe(30);
  });

  it("abandonne une partie Odin en cours : efface le brouillon et revient à la page du jeu", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "odin-v1", players_min: 2, players_max: 6 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await router.push("/jeu/wizard/partie");
    await flushPromises();
    await flushPromises();

    await wrapper.findAll(".pl input")[1].trigger("change");
    await wrapper.find(".btn.primary").trigger("click");

    const abandonButton = wrapper
      .findAll(".feuille-step .btn")
      .find((btn) => btn.text() === "Abandonner la partie");
    await abandonButton.trigger("click");
    await flushPromises();

    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(loadDraft("wizard")).toBeNull();
    expect(router.currentRoute.value.path).toBe("/jeu/wizard");
  });

  const VALID_CARD = [
    [8, 0, 20, 0, 0, 56, 0, 72, 82],
    [0, 15, 0, 34, 49, 0, 63, 77, 0],
    [0, 0, 28, 35, 0, 59, 68, 0, 89],
  ];

  async function fillCard(wrapper) {
    const inputs = wrapper.findAll(".carton-setup input");
    for (const [index, input] of inputs.entries()) {
      const r = Math.floor(index / 9);
      const c = index % 9;
      const value = VALID_CARD[r][c];
      if (value) {
        await input.setValue(String(value));
        await input.trigger("change");
      }
    }
  }

  it("bloque « Commencer la partie » tant que le carton Bingo n'est pas valide", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "bingo-v1", players_min: 1, players_max: 1 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    expect(wrapper.findAll(".carton-setup input")).toHaveLength(27);
    expect(wrapper.find(".btn.primary").attributes("disabled")).toBeDefined();
    expect(wrapper.find(".error-add").text()).toContain("La ligne 1 doit avoir 5 numéros");

    await fillCard(wrapper);
    expect(wrapper.find(".error-add").exists()).toBe(false);
    expect(wrapper.find(".btn.primary").attributes("disabled")).toBeUndefined();

    const firstInput = wrapper.findAll(".carton-setup input")[0];
    await firstInput.setValue("");
    await firstInput.trigger("change");
    expect(wrapper.find(".error-add").text()).toContain("La ligne 1 doit avoir 5 numéros");
  });

  it("démarre une partie Bingo et affiche la feuille dédiée, sans classement", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "bingo-v1", players_min: 1, players_max: 1 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await fillCard(wrapper);
    await wrapper.find(".btn.primary").trigger("click");

    expect(wrapper.findComponent(FeuilleBingo).exists()).toBe(true);
    expect(wrapper.find(".classement").exists()).toBe(false);
  });

  it("n'autorise pas l'enregistrement d'une partie Bingo sans palier gagné", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "bingo-v1", players_min: 1, players_max: 1 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await fillCard(wrapper);
    await wrapper.find(".btn.primary").trigger("click");

    const feuille = wrapper.findComponent(FeuilleBingo);
    feuille.vm.$emit("update:scores", { 3: 0 });
    feuille.vm.$emit("update:details", {
      carton: VALID_CARD,
      tirage: [],
      gagne: { quine: false, double_quine: false, carton_plein: false },
    });
    feuille.vm.$emit("fin");
    await flushPromises();

    expect(wrapper.find(".bandeau-fin .btn.primary").attributes("disabled")).toBeDefined();
    expect(wrapper.text()).toContain("Seules les parties gagnées sont enregistrées.");
  });

  it("enregistre une partie Bingo gagnée avec le détail en bingo-v1", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "bingo-v1", players_min: 1, players_max: 1 }),
      players: makePlayers(),
    });
    supabase.rpc.mockResolvedValue({ error: null });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    await fillCard(wrapper);
    await wrapper.find(".btn.primary").trigger("click");

    const feuille = wrapper.findComponent(FeuilleBingo);
    const bingoDetails = {
      carton: VALID_CARD,
      tirage: [8, 20, 56, 72, 82],
      gagne: { quine: true, double_quine: false, carton_plein: false },
    };
    feuille.vm.$emit("update:scores", { 3: 1 });
    feuille.vm.$emit("update:details", bingoDetails);
    feuille.vm.$emit("fin");
    await flushPromises();

    expect(wrapper.find(".bandeau-fin .btn.primary").attributes("disabled")).toBeUndefined();
    await wrapper.find(".bandeau-fin .btn.primary").trigger("click");
    await flushPromises();

    expect(supabase.rpc).toHaveBeenCalledWith("save_match", {
      p_game_id: 10,
      p_players: expect.arrayContaining([expect.objectContaining({ player_id: 3, score: 1 })]),
      p_notes: null,
      p_details: bingoDetails,
      p_details_format: "bingo-v1",
    });
  });

  it("reprend un brouillon Bingo avec son carton, son tirage et ses paliers", async () => {
    user.value = { email: "lea@example.fr" };
    const bingoDetails = {
      carton: VALID_CARD,
      tirage: [8],
      gagne: { quine: false, double_quine: false, carton_plein: false },
    };
    saveDraft("wizard", { playerIds: [3], scores: { 3: 0 }, details: bingoDetails });
    mockTables({
      game: makeGame({ sheet: "bingo-v1", players_min: 1, players_max: 1 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await flushPromises();
    await flushPromises();

    const feuille = wrapper.findComponent(FeuilleBingo);
    expect(feuille.exists()).toBe(true);
    expect(feuille.props("initialDetails")).toEqual(bingoDetails);
    expect(feuille.props("card")).toEqual(VALID_CARD);
  });

  it("abandonne une partie Bingo en cours : efface le brouillon et revient à la page du jeu", async () => {
    user.value = { email: "lea@example.fr" };
    mockTables({
      game: makeGame({ sheet: "bingo-v1", players_min: 1, players_max: 1 }),
      players: makePlayers(),
    });
    const wrapper = mountPartie();
    await router.push("/jeu/wizard/partie");
    await flushPromises();
    await flushPromises();

    await fillCard(wrapper);
    await wrapper.find(".btn.primary").trigger("click");

    const abandonButton = wrapper
      .findAll(".feuille-step .btn")
      .find((btn) => btn.text() === "Abandonner la partie");
    await abandonButton.trigger("click");
    await flushPromises();

    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(loadDraft("wizard")).toBeNull();
    expect(router.currentRoute.value.path).toBe("/jeu/wizard");
  });
});
