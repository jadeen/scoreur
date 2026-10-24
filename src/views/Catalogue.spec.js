import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { supabase } from "../lib/supabase";
import Catalogue from "./Catalogue.vue";

vi.mock("../lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

function mockGamesResponse({ data = null, error = null }) {
  supabase.from.mockReturnValue({
    select: () => ({
      order: () => Promise.resolve({ data, error }),
    }),
  });
}

// Déjà trié par nom, comme le ferait `.order('name')` côté Supabase (le mock ne trie pas lui-même).
const games = [
  {
    slug: "bingo",
    name: "Bingo",
    players_min: 1,
    players_max: 1,
    sheet: "bingo-v1",
    lower_wins: false,
  },
  {
    slug: "test-egal",
    name: "Jeu Test",
    players_min: 4,
    players_max: 4,
    sheet: "generique",
    lower_wins: false,
  },
  {
    slug: "odin",
    name: "Odin",
    players_min: 2,
    players_max: 6,
    sheet: "odin-v1",
    lower_wins: true,
  },
  {
    slug: "wizard",
    name: "Wizard",
    players_min: 3,
    players_max: 6,
    sheet: "wizard-v1",
    lower_wins: false,
  },
];

describe("Catalogue", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("affiche un état de chargement avant la réponse de Supabase", () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);

    expect(wrapper.find(".muted").text()).toBe("Chargement du catalogue…");
  });

  it("affiche la liste des jeux avec un badge joueurs et un badge de trait distinctif", async () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);
    await flushPromises();

    const items = wrapper.findAll(".item");
    expect(items).toHaveLength(4);
    expect(items[0].find(".t strong").text()).toBe("Bingo");
    expect(items[0].findAll(".item-tags .tag").map((tag) => tag.text())).toEqual([
      "solo",
      "quine, double quine, carton plein",
    ]);
    expect(items[2].find(".t strong").text()).toBe("Odin");
    expect(items[2].findAll(".item-tags .tag").map((tag) => tag.text())).toEqual([
      "2 à 6 joueurs",
      "le plus bas gagne",
    ]);
    // Jeu Test (sheet générique) : aucun trait connu, un seul badge.
    expect(items[1].findAll(".item-tags .tag").map((tag) => tag.text())).toEqual(["4 joueurs"]);
  });

  it("filtre les jeux par nom", async () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);
    await flushPromises();

    await wrapper.find("#recherche-jeu").setValue("wiz");
    expect(wrapper.findAll(".item")).toHaveLength(1);
    expect(wrapper.find(".item .t strong").text()).toBe("Wizard");
  });

  it("affiche un message quand aucun jeu ne correspond à la recherche", async () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);
    await flushPromises();

    await wrapper.find("#recherche-jeu").setValue("inexistant");
    expect(wrapper.find(".muted").text()).toBe("Aucun jeu ne correspond à ta recherche.");
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    mockGamesResponse({ error: { message: "boom" } });
    const wrapper = mount(Catalogue);
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe(
      "Impossible de charger le catalogue pour le moment.",
    );
  });

  it("affiche les chips de catégorie avec « Tous » actif par défaut", async () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);
    await flushPromises();

    const chips = wrapper.findAll(".chip");
    expect(chips.map((chip) => chip.text())).toEqual([
      "Tous",
      "Solo",
      "Par manches",
      "Le plus bas gagne",
    ]);
    expect(chips[0].classes()).toContain("on");
    expect(chips[1].classes()).not.toContain("on");
  });

  it("filtre sur la catégorie Solo", async () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);
    await flushPromises();

    await wrapper.findAll(".chip")[1].trigger("click");
    expect(wrapper.findAll(".chip")[1].classes()).toContain("on");
    expect(wrapper.findAll(".chip")[0].classes()).not.toContain("on");
    const items = wrapper.findAll(".item");
    expect(items).toHaveLength(1);
    expect(items[0].find(".t strong").text()).toBe("Bingo");
  });

  it("filtre sur la catégorie Par manches", async () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);
    await flushPromises();

    await wrapper.findAll(".chip")[2].trigger("click");
    const items = wrapper.findAll(".item");
    expect(items.map((item) => item.find(".t strong").text())).toEqual(["Odin", "Wizard"]);
  });

  it("combine Solo et Le plus bas gagne (OU logique)", async () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);
    await flushPromises();

    await wrapper.findAll(".chip")[1].trigger("click");
    await wrapper.findAll(".chip")[3].trigger("click");
    const items = wrapper.findAll(".item");
    expect(items.map((item) => item.find(".t strong").text())).toEqual(["Bingo", "Odin"]);
  });

  it("désactive une catégorie en la recliquant, et « Tous » réinitialise", async () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);
    await flushPromises();

    await wrapper.findAll(".chip")[1].trigger("click");
    await wrapper.findAll(".chip")[1].trigger("click");
    expect(wrapper.findAll(".chip")[1].classes()).not.toContain("on");
    expect(wrapper.findAll(".item")).toHaveLength(4);

    await wrapper.findAll(".chip")[2].trigger("click");
    await wrapper.findAll(".chip")[0].trigger("click");
    expect(wrapper.findAll(".chip")[0].classes()).toContain("on");
    expect(wrapper.findAll(".item")).toHaveLength(4);
  });

  it("filtre aussi via les cases à cocher de la colonne de filtres (desktop)", async () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);
    await flushPromises();

    const checkboxes = wrapper.findAll(".checkbox-filters input[type=checkbox]");
    expect(checkboxes).toHaveLength(3);

    await checkboxes[0].setValue(true);
    expect(wrapper.findAll(".item")).toHaveLength(1);
    expect(wrapper.find(".item .t strong").text()).toBe("Bingo");
  });
});
