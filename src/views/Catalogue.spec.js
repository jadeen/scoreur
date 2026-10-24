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
  { slug: "bingo", name: "Bingo", players_min: 1, players_max: 1 },
  { slug: "test-egal", name: "Jeu Test", players_min: 4, players_max: 4 },
  { slug: "odin", name: "Odin", players_min: 2, players_max: 6 },
  { slug: "wizard", name: "Wizard", players_min: 3, players_max: 6 },
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

  it("affiche la liste des jeux avec leurs libellés de joueurs", async () => {
    mockGamesResponse({ data: games });
    const wrapper = mount(Catalogue);
    await flushPromises();

    const items = wrapper.findAll(".item");
    expect(items).toHaveLength(4);
    expect(items[0].find(".t strong").text()).toBe("Bingo");
    expect(items[0].find(".t span").text()).toBe("solo");
    expect(items[2].find(".t strong").text()).toBe("Odin");
    expect(items[2].find(".t span").text()).toBe("2 à 6 joueurs");
    expect(items[1].find(".t span").text()).toBe("4 joueurs");
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
});
