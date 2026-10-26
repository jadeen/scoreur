import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { user } from "../lib/auth";
import { router } from "../router";
import { supabase } from "../lib/supabase";
import Partie from "./Partie.vue";

vi.mock("../lib/auth", async () => {
  const { ref } = await import("vue");
  return { user: ref(null) };
});

vi.mock("../lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

function mockMatchTable({ select, deleteImpl } = {}) {
  const eqForDelete = vi.fn(() => (deleteImpl ? deleteImpl() : Promise.resolve({ error: null })));
  const deleteFn = vi.fn(() => ({ eq: eqForDelete }));
  supabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve(select ?? { data: null, error: null }),
      }),
    }),
    delete: deleteFn,
  });
  return { deleteFn, eqForDelete };
}

function makeMatchDetail(overrides = {}) {
  return {
    id: 42,
    played_at: "2026-10-23T12:00:00Z",
    notes: null,
    games: { name: "Wizard", lower_wins: false },
    match_players: [
      { score: 210, players: { id: 1, name: "Léa" } },
      { score: 180, players: { id: 2, name: "Moi" } },
      { score: 150, players: { id: 3, name: "Hugo" } },
      { score: 40, players: { id: 4, name: "Inès" } },
    ],
    ...overrides,
  };
}

let wrapper;

function mountPartie(id = "42") {
  wrapper = mount(Partie, { props: { id }, global: { plugins: [router] } });
  return wrapper;
}

describe("Partie", () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.clearAllMocks();
    user.value = null;
  });

  it("invite à se connecter quand personne n'est connecté", () => {
    mockMatchTable({ select: { data: makeMatchDetail(), error: null } });
    const wrapper = mountPartie();

    expect(wrapper.find(".note").text()).toBe("Connecte-toi avec Google pour revoir tes parties.");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("affiche un état de chargement avant la réponse de Supabase", () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({ select: { data: makeMatchDetail(), error: null } });
    const wrapper = mountPartie();

    expect(wrapper.find(".muted").text()).toBe("Chargement…");
  });

  it("affiche le jeu, la date, le vainqueur et le classement", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({ select: { data: makeMatchDetail(), error: null } });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find("h1.h1").text()).toBe("Wizard");
    expect(wrapper.find("h1.h1 + p.muted").text()).toBe("Vendredi 23 octobre · 4 joueurs");

    expect(wrapper.find(".win .muted").text()).toBe("Vainqueur");
    expect(wrapper.find(".win strong").text()).toBe("Léa");
    expect(wrapper.findAll(".win .muted")[1].text()).toBe("210 points");

    const rows = wrapper.findAll(".rk");
    expect(rows.map((row) => row.find(".n").text())).toEqual(["1", "2", "3", "4"]);
    expect(rows.map((row) => row.text())).toEqual([
      expect.stringContaining("Léa"),
      expect.stringContaining("Moi"),
      expect.stringContaining("Hugo"),
      expect.stringContaining("Inès"),
    ]);

    expect(wrapper.find(".box").exists()).toBe(false);
    expect(wrapper.find(".danger").text()).toBe("Supprimer cette partie");
  });

  it("affiche « solo » pour une partie à un seul joueur", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({
      select: {
        data: makeMatchDetail({ match_players: [{ score: 1, players: { id: 1, name: "Moi" } }] }),
        error: null,
      },
    });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find("h1.h1 + p.muted").text()).toBe("Vendredi 23 octobre · solo");
  });

  it("affiche « Vainqueurs » au pluriel et les noms regroupés en cas d'égalité", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({
      select: {
        data: makeMatchDetail({
          match_players: [
            { score: 50, players: { id: 1, name: "Léa" } },
            { score: 50, players: { id: 2, name: "Hugo" } },
          ],
        }),
        error: null,
      },
    });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".win .muted").text()).toBe("Vainqueurs");
    expect(wrapper.find(".win strong").text()).toBe("Léa, Hugo");
  });

  it("respecte lower_wins du jeu pour désigner le vainqueur (Odin)", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({
      select: {
        data: makeMatchDetail({
          games: { name: "Odin", lower_wins: true },
          match_players: [
            { score: 20, players: { id: 1, name: "Léa" } },
            { score: 5, players: { id: 2, name: "Hugo" } },
          ],
        }),
        error: null,
      },
    });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".win strong").text()).toBe("Hugo");
  });

  it("affiche la feuille de manches Wizard reconstituée depuis le détail archivé", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({
      select: {
        data: makeMatchDetail({
          details_format: "wizard-v1",
          details: {
            joueurs: [1, 2],
            premier_donneur: 0,
            variante_pas_egal: false,
            manches: [{ annonces: [0, 1], plis: [0, 1] }],
          },
          match_players: [
            { score: 20, players: { id: 1, name: "Léa" } },
            { score: 30, players: { id: 2, name: "Hugo" } },
          ],
        }),
        error: null,
      },
    });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".h2").text()).toBe("Feuille de score");
    const headers = wrapper.findAll("th");
    expect(headers.map((th) => th.text())).toEqual(["Manche", "Léa", "Hugo"]);
    expect(wrapper.find("tbody td .tot").text()).toBe("20");
    expect(wrapper.find(".muted.empty").exists()).toBe(false);
    expect(wrapper.text()).toContain(
      "Feuille redessinée à partir du détail archivé (format wizard-v1), en lecture seule.",
    );
  });

  it("affiche la feuille de manches Odin reconstituée depuis le détail archivé", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({
      select: {
        data: makeMatchDetail({
          games: { name: "Odin", lower_wins: true },
          details_format: "odin-v1",
          details: { joueurs: [1, 2], seuil: 15, manches: [[0, 4]] },
          match_players: [
            { score: 0, players: { id: 1, name: "Léa" } },
            { score: 4, players: { id: 2, name: "Hugo" } },
          ],
        }),
        error: null,
      },
    });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".h2").text()).toBe("Feuille de score");
    const headers = wrapper.findAll("th");
    expect(headers.map((th) => th.text())).toEqual(["Manche", "Léa", "Hugo"]);
    expect(wrapper.find("tbody td .tot").text()).toBe("0");
    expect(wrapper.text()).toContain(
      "Feuille redessinée à partir du détail archivé (format odin-v1), en lecture seule.",
    );
  });

  it("affiche le carton Bingo reconstitué depuis le détail archivé", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({
      select: {
        data: makeMatchDetail({
          games: { name: "Bingo", lower_wins: false },
          details_format: "bingo-v1",
          details: {
            carton: [
              [8, 0, 20, 0, 0, 56, 0, 72, 82],
              [0, 15, 0, 34, 49, 0, 63, 77, 0],
              [0, 0, 28, 35, 0, 59, 68, 0, 89],
            ],
            tirage: [8, 20, 56, 72, 82],
            gagne: { quine: true, double_quine: false, carton_plein: false },
          },
          match_players: [{ score: 1, players: { id: 1, name: "Moi" } }],
        }),
        error: null,
      },
    });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".h2").text()).toBe("Carton");
    expect(wrapper.findAll(".carton-cell")).toHaveLength(27);
    expect(wrapper.findAll(".carton-cell.hit")).toHaveLength(5);
    expect(wrapper.text()).toContain("5 numéros tirés · Quine");
    expect(wrapper.text()).toContain(
      "Feuille redessinée à partir du détail archivé (format bingo-v1), en lecture seule.",
    );
  });

  it("n'affiche pas de feuille de manches pour une partie générique", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({ select: { data: makeMatchDetail(), error: null } });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find("table").exists()).toBe(false);
  });

  it("affiche la note de la partie quand il y en a une", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({
      select: {
        data: makeMatchDetail({ notes: "Chez Hugo, première partie d'Inès." }),
        error: null,
      },
    });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".box .muted").text()).toBe("Chez Hugo, première partie d'Inès.");
  });

  it("affiche la page introuvable quand la partie n'existe pas", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({ select: { data: null, error: null } });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find("h1.h1").text()).toBe("Partie introuvable");
    const actions = wrapper.findAll(".introuvable__actions .btn");
    expect(actions[0].text()).toBe("Voir l'historique");
    expect(actions[0].attributes("href")).toBe("#/historique");
    expect(actions[1].text()).toBe("Retour à l'accueil");
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({ select: { data: null, error: { message: "boom" } } });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe(
      "Impossible de charger cette partie pour le moment.",
    );
  });

  it("recharge la partie quand l'id change", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({ select: { data: makeMatchDetail(), error: null } });
    const wrapper = mountPartie();
    await flushPromises();
    expect(wrapper.find("h1.h1").text()).toBe("Wizard");

    mockMatchTable({
      select: {
        data: makeMatchDetail({ id: 7, games: { name: "Odin", lower_wins: true } }),
        error: null,
      },
    });
    await wrapper.setProps({ id: "7" });
    await flushPromises();

    expect(wrapper.find("h1.h1").text()).toBe("Odin");
  });

  it("demande confirmation avant de supprimer, et annule sans appeler Supabase", async () => {
    user.value = { email: "lea@example.fr" };
    const { deleteFn } = mockMatchTable({ select: { data: makeMatchDetail(), error: null } });
    const wrapper = mountPartie();
    await flushPromises();

    await wrapper.find(".danger").trigger("click");
    expect(wrapper.find(".confirm-delete .muted").text()).toBe(
      "Supprimer définitivement cette partie ?",
    );

    await wrapper.find(".btn:not(.red)").trigger("click");
    expect(wrapper.find(".confirm-delete").exists()).toBe(false);
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it("désactive les actions et change le texte pendant la suppression, puis redirige vers l'historique", async () => {
    user.value = { email: "lea@example.fr" };
    let resolveDelete;
    const { eqForDelete } = mockMatchTable({
      select: { data: makeMatchDetail(), error: null },
      deleteImpl: () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        }),
    });
    const wrapper = mountPartie();
    await flushPromises();

    await wrapper.find(".danger").trigger("click");
    await wrapper.find(".btn.red").trigger("click");

    const confirmButton = wrapper.find(".btn.red");
    expect(confirmButton.text()).toBe("Suppression…");
    expect(confirmButton.attributes("disabled")).toBeDefined();
    expect(wrapper.find(".btn:not(.red)").attributes("disabled")).toBeDefined();

    resolveDelete({ error: null });
    await flushPromises();

    expect(eqForDelete).toHaveBeenCalledWith("id", 42);
    expect(router.currentRoute.value.path).toBe("/historique");
  });

  it("affiche un message d'erreur si la suppression échoue", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({
      select: { data: makeMatchDetail(), error: null },
      deleteImpl: () => Promise.resolve({ error: { message: "boom" } }),
    });
    const wrapper = mountPartie();
    await flushPromises();

    await wrapper.find(".danger").trigger("click");
    await wrapper.find(".btn.red").trigger("click");
    await flushPromises();

    expect(wrapper.find(".error-delete").text()).toBe(
      "Impossible de supprimer cette partie pour le moment.",
    );
  });
});
