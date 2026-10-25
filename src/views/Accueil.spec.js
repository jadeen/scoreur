import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { signInWithGoogle, user } from "../lib/auth";
import { router } from "../router";
import { supabase } from "../lib/supabase";
import Accueil from "./Accueil.vue";

vi.mock("../lib/auth", async () => {
  const { ref } = await import("vue");
  return { user: ref(null), signInWithGoogle: vi.fn() };
});

vi.mock("../lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

function mountAccueil() {
  return mount(Accueil, { global: { plugins: [router] } });
}

function mockResponse({ data = [], error = null } = {}) {
  supabase.from.mockReturnValue({
    select: () => ({
      order: () => ({
        limit: () => Promise.resolve({ data, error }),
      }),
    }),
  });
}

const games = [
  { slug: "wizard", name: "Wizard", color: "#2f4b8f", players_min: 3, players_max: 6 },
  { slug: "odin", name: "Odin", color: "#2c7fa3", players_min: 2, players_max: 6 },
  { slug: "bingo", name: "Bingo", color: "#c8572f", players_min: 1, players_max: 1 },
];

function makeMatch(overrides = {}) {
  return {
    id: 1,
    played_at: "2026-10-24T20:00:00Z",
    games: { slug: "wizard", name: "Wizard", color: "#2f4b8f" },
    match_players: [
      { score: 210, is_winner: true, players: { name: "Léa" } },
      { score: 180, is_winner: false, players: { name: "Moi" } },
    ],
    ...overrides,
  };
}

let wrapper;

describe("Accueil, visiteur", () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.clearAllMocks();
    user.value = null;
  });

  it("affiche l'accroche avant la réponse de Supabase, avec la section jeux en chargement", () => {
    mockResponse({ data: games });
    wrapper = mountAccueil();

    expect(wrapper.find("h1.h1").text()).toBe("Le carnet de scores de vos soirées jeux");
    expect(wrapper.find(".state-loading").text()).toBe("Chargement…");
  });

  it("affiche l'accroche, le CTA de connexion et les jeux en vedette", async () => {
    mockResponse({ data: games });
    wrapper = mountAccueil();
    await flushPromises();

    const cta = wrapper.find("button.btn.primary");
    expect(cta.text()).toBe("Se connecter avec Google");
    await cta.trigger("click");
    expect(signInWithGoogle).toHaveBeenCalledOnce();

    const boxes = wrapper.findAll(".accueil-games .box");
    expect(boxes).toHaveLength(4);
    expect(boxes[0].find("strong").text()).toBe("Wizard");
    expect(boxes[0].find(".tag").text()).toBe("3 à 6 joueurs");
    expect(boxes[0].attributes("href")).toBe("#/jeu/wizard");
    expect(boxes[2].find(".tag").text()).toBe("solo");

    expect(boxes[3].find("strong").text()).toBe("Autres jeux");
    expect(boxes[3].attributes("href")).toBe("#/jeux");

    expect(wrapper.find(".note").text()).toBe(
      "Visiteur : le catalogue et les pages de jeu sont consultables sans compte.",
    );
  });

  it("affiche un message d'erreur si le chargement du catalogue échoue", async () => {
    mockResponse({ data: null, error: { message: "boom" } });
    wrapper = mountAccueil();
    await flushPromises();

    expect(wrapper.find(".state-error").text()).toBe(
      "Impossible de charger le catalogue pour le moment.",
    );
  });
});

describe("Accueil, connecté", () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.clearAllMocks();
    user.value = null;
  });

  it("affiche un état de chargement avant la réponse de Supabase", () => {
    user.value = { email: "lea@example.fr" };
    mockResponse({ data: [makeMatch()] });
    wrapper = mountAccueil();

    expect(wrapper.find("h1.h1").text()).toBe("Bonsoir");
    expect(wrapper.find(".state-loading").text()).toBe("Chargement…");
  });

  it("affiche le CTA, les jeux récents et les dernières parties", async () => {
    user.value = { email: "lea@example.fr" };
    mockResponse({
      data: [
        makeMatch({ id: 1, played_at: "2026-10-24T20:00:00Z" }),
        makeMatch({
          id: 2,
          played_at: "2026-10-17T20:00:00Z",
          games: { slug: "odin", name: "Odin", color: "#2c7fa3" },
          match_players: [{ score: 9, is_winner: true, players: { name: "Tom" } }],
        }),
        makeMatch({
          id: 3,
          played_at: "2026-10-10T20:00:00Z",
          games: { slug: "bingo", name: "Bingo", color: "#c8572f" },
          match_players: [{ score: 1, is_winner: true, players: { name: "Moi" } }],
        }),
      ],
    });
    wrapper = mountAccueil();
    await flushPromises();

    const cta = wrapper.find(".accueil-cta");
    expect(cta.text()).toBe("+ Nouvelle partie");
    expect(cta.attributes("href")).toBe("#/jeux");

    const tiles = wrapper.findAll(".accueil-recent-games .tile");
    expect(tiles.map((tile) => tile.find("strong").text())).toEqual(["Wizard", "Odin", "Bingo"]);
    expect(tiles[0].attributes("href")).toBe("#/jeu/wizard/partie");
    expect(tiles[0].find(".muted").text()).toBe("24 oct.");

    const items = wrapper.findAll(".accueil-matches .item");
    expect(items).toHaveLength(3);
    expect(items[0].find(".row strong").text()).toBe("Wizard");
    expect(items[0].attributes("href")).toBe("#/partie/1");

    const quicklinks = wrapper.findAll(".accueil-quicklinks .btn");
    expect(quicklinks.map((link) => link.text())).toEqual(["Mes joueurs", "Catalogue"]);
    expect(quicklinks[0].attributes("href")).toBe("#/joueurs");
    expect(quicklinks[1].attributes("href")).toBe("#/jeux");
  });

  it("déduplique les jeux récents par jeu et les limite à trois, sans dédupliquer les dernières parties", async () => {
    user.value = { email: "lea@example.fr" };
    mockResponse({
      data: [
        makeMatch({ id: 1, played_at: "2026-10-24T20:00:00Z" }),
        makeMatch({ id: 2, played_at: "2026-10-23T20:00:00Z" }),
        makeMatch({
          id: 3,
          played_at: "2026-10-17T20:00:00Z",
          games: { slug: "odin", name: "Odin", color: "#2c7fa3" },
          match_players: [{ score: 9, is_winner: true, players: { name: "Tom" } }],
        }),
        makeMatch({
          id: 4,
          played_at: "2026-10-10T20:00:00Z",
          games: { slug: "bingo", name: "Bingo", color: "#c8572f" },
          match_players: [{ score: 1, is_winner: true, players: { name: "Moi" } }],
        }),
        makeMatch({
          id: 5,
          played_at: "2026-10-05T20:00:00Z",
          games: { slug: "tarot", name: "Tarot", color: "#b8432a" },
          match_players: [{ score: 50, is_winner: true, players: { name: "Moi" } }],
        }),
      ],
    });
    wrapper = mountAccueil();
    await flushPromises();

    const tiles = wrapper.findAll(".accueil-recent-games .tile");
    expect(tiles.map((tile) => tile.find("strong").text())).toEqual(["Wizard", "Odin", "Bingo"]);

    const items = wrapper.findAll(".accueil-matches .item");
    expect(items.map((item) => item.attributes("href"))).toEqual([
      "#/partie/1",
      "#/partie/2",
      "#/partie/3",
    ]);
  });

  it("n'affiche pas les jeux récents et indique qu'aucune partie n'est enregistrée", async () => {
    user.value = { email: "lea@example.fr" };
    mockResponse({ data: [] });
    wrapper = mountAccueil();
    await flushPromises();

    expect(wrapper.find(".accueil-recent-games").exists()).toBe(false);
    expect(wrapper.find(".state-empty").text()).toBe("Aucune partie enregistrée pour l'instant.");
  });

  it("affiche un message d'erreur si le chargement des parties échoue", async () => {
    user.value = { email: "lea@example.fr" };
    mockResponse({ data: null, error: { message: "boom" } });
    wrapper = mountAccueil();
    await flushPromises();

    expect(wrapper.find(".state-error").text()).toBe(
      "Impossible de charger tes parties pour le moment.",
    );
  });
});
