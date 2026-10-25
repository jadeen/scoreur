import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { user } from "../lib/auth";
import { router } from "../router";
import { supabase } from "../lib/supabase";
import Historique from "./Historique.vue";

vi.mock("../lib/auth", async () => {
  const { ref } = await import("vue");
  return { user: ref(null) };
});

vi.mock("../lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

function mockMatchesTable({ data = [], error = null } = {}) {
  supabase.from.mockReturnValue({
    select: () => ({
      order: () => Promise.resolve({ data, error }),
    }),
  });
}

function makeMatch(overrides = {}) {
  return {
    id: 42,
    played_at: "2026-10-23T12:00:00Z",
    games: { name: "Wizard", slug: "wizard" },
    match_players: [
      { score: 210, is_winner: true, players: { name: "Léa" } },
      { score: 180, is_winner: false, players: { name: "Moi" } },
      { score: 150, is_winner: false, players: { name: "Hugo" } },
      { score: 40, is_winner: false, players: { name: "Inès" } },
    ],
    ...overrides,
  };
}

function mountHistorique() {
  return mount(Historique, { global: { plugins: [router] } });
}

describe("Historique", () => {
  afterEach(() => {
    vi.clearAllMocks();
    user.value = null;
  });

  it("invite à se connecter quand personne n'est connecté", () => {
    mockMatchesTable({ data: [makeMatch()] });
    const wrapper = mountHistorique();

    expect(wrapper.find(".note").text()).toBe(
      "Connecte-toi avec Google pour voir tes parties passées.",
    );
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("affiche un état de chargement avant la réponse de Supabase", () => {
    user.value = { email: "lea@example.fr" };
    mockMatchesTable({ data: [makeMatch()] });
    const wrapper = mountHistorique();

    expect(wrapper.find(".state-loading").text()).toBe("Chargement des parties…");
  });

  it("affiche chaque partie avec le jeu, la date et le résumé de victoire", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchesTable({ data: [makeMatch()] });
    const wrapper = mountHistorique();
    await flushPromises();

    const item = wrapper.find(".item");
    expect(item.find(".row strong").text()).toBe("Wizard");
    expect(item.find(".row .muted").text()).toBe("23 oct.");
    expect(item.findAll(".muted")[1].text()).toBe("4 joueurs · victoire : Léa (210 pts)");
    expect(item.attributes("href")).toBe("#/partie/42");
  });

  it("affiche « solo » pour une partie à un seul joueur", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchesTable({
      data: [
        makeMatch({
          id: 7,
          games: { name: "Bingo", slug: "bingo" },
          match_players: [{ score: 1, is_winner: true, players: { name: "Moi" } }],
        }),
      ],
    });
    const wrapper = mountHistorique();
    await flushPromises();

    expect(wrapper.findAll(".muted")[1].text()).toBe("solo · victoire : Moi (1 pts)");
  });

  it("regroupe les noms des gagnants en cas d'égalité", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchesTable({
      data: [
        makeMatch({
          match_players: [
            { score: 50, is_winner: true, players: { name: "Léa" } },
            { score: 50, is_winner: true, players: { name: "Hugo" } },
          ],
        }),
      ],
    });
    const wrapper = mountHistorique();
    await flushPromises();

    expect(wrapper.findAll(".muted")[1].text()).toBe("2 joueurs · victoire : Léa, Hugo (50 pts)");
  });

  it("affiche un message quand il n'y a pas encore de partie", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchesTable({ data: [] });
    const wrapper = mountHistorique();
    await flushPromises();

    expect(wrapper.find(".state-empty").text()).toBe("Aucune partie enregistrée pour l'instant.");
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchesTable({ data: null, error: { message: "boom" } });
    const wrapper = mountHistorique();
    await flushPromises();

    expect(wrapper.find(".state-error").text()).toBe(
      "Impossible de charger l'historique pour le moment.",
    );
  });

  it("vide la liste et affiche l'invite de connexion quand l'utilisateur se déconnecte", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchesTable({ data: [makeMatch()] });
    const wrapper = mountHistorique();
    await flushPromises();
    expect(wrapper.findAll(".item")).toHaveLength(1);

    user.value = null;
    await flushPromises();

    expect(wrapper.find(".note").text()).toBe(
      "Connecte-toi avec Google pour voir tes parties passées.",
    );
  });
});
