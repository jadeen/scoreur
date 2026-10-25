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

function mountPartie(id = "42") {
  return mount(Partie, { props: { id }, global: { plugins: [router] } });
}

describe("Partie", () => {
  afterEach(() => {
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

  it("affiche un message quand la partie n'existe pas", async () => {
    user.value = { email: "lea@example.fr" };
    mockMatchTable({ select: { data: null, error: null } });
    const wrapper = mountPartie();
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe("Cette partie n'existe pas.");
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
