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

function mockGamesBySlug(gamesBySlug) {
  supabase.from.mockReturnValue({
    select: () => ({
      eq: (_column, slug) => ({
        maybeSingle: () => Promise.resolve({ data: gamesBySlug[slug] ?? null, error: null }),
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

  it("affiche le jeu avec ses traits, sa description et comment on compte", async () => {
    mockGameResponse({
      data: {
        slug: "wizard",
        name: "Wizard",
        description: "Un jeu de plis.",
        players_min: 3,
        players_max: 6,
        sheet: "wizard-v1",
        lower_wins: false,
        trait: "annonces et plis",
        scoring_summary: "Annonce exacte : 20 points + 10 par pli. Sinon −10 par pli d'écart.",
      },
    });
    const wrapper = mount(Jeu, { props: { slug: "wizard" } });
    await flushPromises();

    expect(wrapper.find("h1.h1").text()).toBe("Wizard");
    const chips = wrapper.findAll(".tag");
    expect(chips.map((chip) => chip.text())).toEqual([
      "3 à 6 joueurs",
      "Par manches",
      "annonces et plis",
    ]);
    expect(wrapper.find(".box .label").text()).toBe("Comment on compte");
    expect(wrapper.find(".box .muted").text()).toContain("Annonce exacte");
    expect(wrapper.find(".note").text()).toBe(
      "Connecte-toi pour enregistrer une partie de Wizard et suivre tes statistiques.",
    );
  });

  it("affiche le libellé solo et le trait des paliers pour Bingo", async () => {
    mockGameResponse({
      data: {
        slug: "bingo",
        name: "Bingo",
        players_min: 1,
        players_max: 1,
        sheet: "bingo-v1",
        lower_wins: false,
        trait: "quine, double quine, carton plein",
      },
    });
    const wrapper = mount(Jeu, { props: { slug: "bingo" } });
    await flushPromises();

    expect(wrapper.findAll(".tag").map((chip) => chip.text())).toEqual([
      "solo",
      "quine, double quine, carton plein",
    ]);
  });

  it("ne duplique pas le trait quand il recoupe un chip déjà dérivé (Odin)", async () => {
    mockGameResponse({
      data: {
        slug: "odin",
        name: "Odin",
        players_min: 2,
        players_max: 6,
        sheet: "odin-v1",
        lower_wins: true,
        trait: "le plus bas gagne",
      },
    });
    const wrapper = mount(Jeu, { props: { slug: "odin" } });
    await flushPromises();

    expect(wrapper.findAll(".tag").map((chip) => chip.text())).toEqual([
      "2 à 6 joueurs",
      "Par manches",
      "Le plus bas gagne",
    ]);
  });

  it("n'affiche ni chip de manches ni bloc de règles pour une feuille générique", async () => {
    mockGameResponse({
      data: {
        slug: "test-egal",
        name: "Jeu Test",
        players_min: 4,
        players_max: 4,
        sheet: "generique",
      },
    });
    const wrapper = mount(Jeu, { props: { slug: "test-egal" } });
    await flushPromises();

    expect(wrapper.findAll(".tag").map((chip) => chip.text())).toEqual(["4 joueurs"]);
    expect(wrapper.findAll(".box")).toHaveLength(0);
  });

  it("n'affiche pas de description quand il n'y en a pas", async () => {
    mockGameResponse({
      data: {
        slug: "bingo",
        name: "Bingo",
        players_min: 1,
        players_max: 1,
        sheet: "bingo-v1",
        lower_wins: false,
        trait: "quine, double quine, carton plein",
      },
    });
    const wrapper = mount(Jeu, { props: { slug: "bingo" } });
    await flushPromises();

    expect(wrapper.find(".jeu-main > p.muted").exists()).toBe(false);
  });

  it("recharge le jeu quand le slug change (navigation Wizard -> Odin)", async () => {
    mockGamesBySlug({
      wizard: {
        slug: "wizard",
        name: "Wizard",
        players_min: 3,
        players_max: 6,
        sheet: "wizard-v1",
      },
      odin: {
        slug: "odin",
        name: "Odin",
        players_min: 2,
        players_max: 6,
        sheet: "odin-v1",
        lower_wins: true,
      },
    });
    const wrapper = mount(Jeu, { props: { slug: "wizard" } });
    await flushPromises();
    expect(wrapper.find("h1.h1").text()).toBe("Wizard");

    await wrapper.setProps({ slug: "odin" });
    expect(wrapper.find(".muted").text()).toBe("Chargement…");
    await flushPromises();

    expect(wrapper.find("h1.h1").text()).toBe("Odin");
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
