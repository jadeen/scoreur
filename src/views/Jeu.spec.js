import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { supabase } from "../lib/supabase";
import Jeu from "./Jeu.vue";

vi.mock("../lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

function mockGameResponse({ data = null, error = null }) {
  supabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve({ data, error }),
      }),
    }),
  });
}

describe("Jeu", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("affiche un état de chargement avant la réponse de Supabase", () => {
    mockGameResponse({ data: { slug: "wizard", name: "Wizard", players_min: 3, players_max: 6 } });
    const wrapper = mount(Jeu, { props: { slug: "wizard" } });

    expect(wrapper.find(".muted").text()).toBe("Chargement…");
  });

  it("affiche le jeu avec son nombre de joueurs et sa description", async () => {
    mockGameResponse({
      data: {
        slug: "wizard",
        name: "Wizard",
        description: "Un jeu de plis.",
        players_min: 3,
        players_max: 6,
      },
    });
    const wrapper = mount(Jeu, { props: { slug: "wizard" } });
    await flushPromises();

    expect(wrapper.find("h1.h1").text()).toBe("Wizard");
    expect(wrapper.find(".chip").text()).toBe("3 à 6 joueurs");
    expect(wrapper.find(".muted").text()).toBe("Un jeu de plis.");
    expect(wrapper.find(".note").text()).toBe(
      "Connecte-toi pour enregistrer une partie de Wizard et suivre tes statistiques.",
    );
  });

  it("affiche le libellé solo pour un jeu à un seul joueur", async () => {
    mockGameResponse({ data: { slug: "bingo", name: "Bingo", players_min: 1, players_max: 1 } });
    const wrapper = mount(Jeu, { props: { slug: "bingo" } });
    await flushPromises();

    expect(wrapper.find(".chip").text()).toBe("solo");
  });

  it("affiche un nombre fixe de joueurs quand min et max sont égaux et non solo", async () => {
    mockGameResponse({
      data: { slug: "test-egal", name: "Jeu Test", players_min: 4, players_max: 4 },
    });
    const wrapper = mount(Jeu, { props: { slug: "test-egal" } });
    await flushPromises();

    expect(wrapper.find(".chip").text()).toBe("4 joueurs");
  });

  it("n'affiche pas de description quand il n'y en a pas", async () => {
    mockGameResponse({ data: { slug: "bingo", name: "Bingo", players_min: 1, players_max: 1 } });
    const wrapper = mount(Jeu, { props: { slug: "bingo" } });
    await flushPromises();

    expect(wrapper.findAll(".muted")).toHaveLength(0);
  });

  it("affiche un message quand le jeu n'existe pas", async () => {
    mockGameResponse({ data: null });
    const wrapper = mount(Jeu, { props: { slug: "inconnu" } });
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe("Ce jeu n'existe pas.");
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    mockGameResponse({ error: { message: "boom" } });
    const wrapper = mount(Jeu, { props: { slug: "wizard" } });
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe("Impossible de charger ce jeu pour le moment.");
  });
});
