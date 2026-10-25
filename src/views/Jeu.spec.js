import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { user } from "../lib/auth";
import { router } from "../router";
import { supabase } from "../lib/supabase";
import Jeu from "./Jeu.vue";

vi.mock("../lib/auth", async () => {
  const { ref } = await import("vue");
  return { user: ref(null) };
});

vi.mock("../lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

function mountJeu(props) {
  return mount(Jeu, { props, global: { plugins: [router] } });
}

function mockGameResponse(
  { data = null, error = null },
  statsResponse = { data: [], error: null },
) {
  supabase.from.mockImplementation((table) => {
    if (table === "games") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data, error }),
          }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve(statsResponse),
        }),
      }),
    };
  });
}

function mockGamesBySlug(gamesBySlug) {
  supabase.from.mockImplementation((table) => {
    if (table === "games") {
      return {
        select: () => ({
          eq: (_column, slug) => ({
            maybeSingle: () => Promise.resolve({ data: gamesBySlug[slug] ?? null, error: null }),
          }),
        }),
      };
    }
    return {
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    };
  });
}

describe("Jeu", () => {
  afterEach(() => {
    vi.clearAllMocks();
    user.value = null;
  });

  it("affiche un état de chargement avant la réponse de Supabase", () => {
    mockGameResponse({
      data: { slug: "wizard", name: "Wizard", players_min: 3, players_max: 6, tags: [] },
    });
    const wrapper = mountJeu({ slug: "wizard" });

    expect(wrapper.find(".muted").text()).toBe("Chargement…");
  });

  it("affiche le jeu avec ses tags, sa description et comment on compte", async () => {
    mockGameResponse({
      data: {
        slug: "wizard",
        name: "Wizard",
        description: "Un jeu de plis.",
        players_min: 3,
        players_max: 6,
        tags: ["par manches", "annonces et plis"],
        scoring_summary: "Annonce exacte : 20 points + 10 par pli. Sinon −10 par pli d'écart.",
      },
    });
    const wrapper = mountJeu({ slug: "wizard" });
    await flushPromises();

    expect(wrapper.find("h1.h1").text()).toBe("Wizard");
    const chips = wrapper.findAll(".tag");
    expect(chips.map((chip) => chip.text())).toEqual([
      "3 à 6 joueurs",
      "par manches",
      "annonces et plis",
    ]);
    expect(wrapper.find(".box .label").text()).toBe("Comment on compte");
    expect(wrapper.find(".box .muted").text()).toContain("Annonce exacte");
    expect(wrapper.find(".note").text()).toBe(
      "Connecte-toi pour enregistrer une partie de Wizard et suivre tes statistiques.",
    );
    expect(wrapper.find(".jeu-main .btn").exists()).toBe(false);
  });

  it("propose une nouvelle partie et ses stats à la place de l'invite de connexion quand connecté", async () => {
    user.value = { email: "lea@example.fr" };
    mockGameResponse({
      data: { id: 1, slug: "wizard", name: "Wizard", players_min: 3, players_max: 6, tags: [] },
    });
    const wrapper = mountJeu({ slug: "wizard" });
    await flushPromises();

    const cta = wrapper.find(".jeu-main .btn");
    expect(cta.text()).toBe("Nouvelle partie de Wizard");
    expect(cta.attributes("href")).toBe("#/jeu/wizard/partie");
    expect(wrapper.find(".jeu-side .note").exists()).toBe(false);
    expect(wrapper.find(".jeu-side .label").text()).toBe("Mes stats");
  });

  it("n'affiche pas deux fois « solo » quand le tag recoupe le badge joueurs (Bingo)", async () => {
    mockGameResponse({
      data: {
        slug: "bingo",
        name: "Bingo",
        players_min: 1,
        players_max: 1,
        tags: ["solo", "quine", "double quine", "carton plein"],
      },
    });
    const wrapper = mountJeu({ slug: "bingo" });
    await flushPromises();

    expect(wrapper.findAll(".tag").map((chip) => chip.text())).toEqual([
      "solo",
      "quine",
      "double quine",
      "carton plein",
    ]);
  });

  it("affiche chaque tag comme un badge séparé (Odin)", async () => {
    mockGameResponse({
      data: {
        slug: "odin",
        name: "Odin",
        players_min: 2,
        players_max: 6,
        tags: ["par manches", "le plus bas gagne"],
      },
    });
    const wrapper = mountJeu({ slug: "odin" });
    await flushPromises();

    expect(wrapper.findAll(".tag").map((chip) => chip.text())).toEqual([
      "2 à 6 joueurs",
      "par manches",
      "le plus bas gagne",
    ]);
  });

  it("n'affiche que le badge joueurs et pas de bloc de règles sans tags ni scoring_summary", async () => {
    mockGameResponse({
      data: { slug: "test-sans-tag", name: "Jeu Test", players_min: 4, players_max: 4, tags: [] },
    });
    const wrapper = mountJeu({ slug: "test-sans-tag" });
    await flushPromises();

    expect(wrapper.findAll(".tag").map((chip) => chip.text())).toEqual(["4 joueurs"]);
    expect(wrapper.findAll(".box")).toHaveLength(0);
  });

  it("n'affiche pas de description quand il n'y en a pas", async () => {
    mockGameResponse({
      data: { slug: "bingo", name: "Bingo", players_min: 1, players_max: 1, tags: ["solo"] },
    });
    const wrapper = mountJeu({ slug: "bingo" });
    await flushPromises();

    expect(wrapper.find(".jeu-main > p.muted").exists()).toBe(false);
  });

  it("recharge le jeu quand le slug change (navigation Wizard -> Odin)", async () => {
    mockGamesBySlug({
      wizard: { slug: "wizard", name: "Wizard", players_min: 3, players_max: 6, tags: [] },
      odin: { slug: "odin", name: "Odin", players_min: 2, players_max: 6, tags: [] },
    });
    const wrapper = mountJeu({ slug: "wizard" });
    await flushPromises();
    expect(wrapper.find("h1.h1").text()).toBe("Wizard");

    await wrapper.setProps({ slug: "odin" });
    expect(wrapper.find(".muted").text()).toBe("Chargement…");
    await flushPromises();

    expect(wrapper.find("h1.h1").text()).toBe("Odin");
  });

  it("affiche un message quand le jeu n'existe pas", async () => {
    mockGameResponse({ data: null });
    const wrapper = mountJeu({ slug: "inconnu" });
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe("Ce jeu n'existe pas.");
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    mockGameResponse({ error: { message: "boom" } });
    const wrapper = mountJeu({ slug: "wizard" });
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe("Impossible de charger ce jeu pour le moment.");
  });

  it("affiche le tableau des stats trié par victoires", async () => {
    user.value = { email: "lea@example.fr" };
    mockGameResponse(
      { data: { id: 3, slug: "wizard", name: "Wizard", players_min: 3, players_max: 6, tags: [] } },
      {
        data: [
          {
            player_id: 1,
            player_name: "Léa",
            parties: 12,
            victoires: 5,
            record: 260,
            moyenne: 168,
          },
          {
            player_id: 2,
            player_name: "Moi",
            parties: 12,
            victoires: 4,
            record: 240,
            moyenne: 155,
          },
        ],
        error: null,
      },
    );
    const wrapper = mountJeu({ slug: "wizard" });
    await flushPromises();

    const rows = wrapper.findAll(".stats-table tbody tr");
    expect(rows).toHaveLength(2);
    expect(rows[0].findAll("td").map((td) => td.text())).toEqual(["Léa", "12", "5", "260", "168"]);
    expect(rows[1].findAll("td").map((td) => td.text())).toEqual(["Moi", "12", "4", "240", "155"]);
  });

  it("affiche un message quand aucune partie n'est enregistrée pour ce jeu", async () => {
    user.value = { email: "lea@example.fr" };
    mockGameResponse({
      data: { id: 4, slug: "wizard", name: "Wizard", players_min: 3, players_max: 6, tags: [] },
    });
    const wrapper = mountJeu({ slug: "wizard" });
    await flushPromises();

    expect(wrapper.find(".jeu-side .muted").text()).toBe(
      "Aucune partie enregistrée pour ce jeu pour l'instant.",
    );
  });

  it("affiche un message d'erreur si le chargement des stats échoue", async () => {
    user.value = { email: "lea@example.fr" };
    mockGameResponse(
      { data: { id: 5, slug: "wizard", name: "Wizard", players_min: 3, players_max: 6, tags: [] } },
      { data: null, error: { message: "boom" } },
    );
    const wrapper = mountJeu({ slug: "wizard" });
    await flushPromises();

    expect(wrapper.find(".jeu-side .muted").text()).toBe(
      "Impossible de charger les statistiques pour le moment.",
    );
  });

  it("affiche un état de chargement des stats avant leur réponse", async () => {
    user.value = { email: "lea@example.fr" };
    let resolveStats;
    const statsPromise = new Promise((resolve) => {
      resolveStats = resolve;
    });
    supabase.from.mockImplementation((table) => {
      if (table === "games") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: () =>
                Promise.resolve({
                  data: {
                    id: 6,
                    slug: "wizard",
                    name: "Wizard",
                    players_min: 3,
                    players_max: 6,
                    tags: [],
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            order: () => statsPromise,
          }),
        }),
      };
    });
    const wrapper = mountJeu({ slug: "wizard" });
    await flushPromises();

    expect(wrapper.find(".jeu-side .muted").text()).toBe("Chargement…");

    resolveStats({ data: [], error: null });
    await flushPromises();

    expect(wrapper.find(".jeu-side .muted").text()).toBe(
      "Aucune partie enregistrée pour ce jeu pour l'instant.",
    );
  });

  it("charge les stats à la connexion sans recharger le jeu", async () => {
    mockGameResponse({
      data: { id: 7, slug: "wizard", name: "Wizard", players_min: 3, players_max: 6, tags: [] },
    });
    const wrapper = mountJeu({ slug: "wizard" });
    await flushPromises();
    expect(wrapper.find(".jeu-side .note").exists()).toBe(true);

    mockGameResponse(
      { data: { id: 7, slug: "wizard", name: "Wizard", players_min: 3, players_max: 6, tags: [] } },
      {
        data: [
          { player_id: 1, player_name: "Léa", parties: 3, victoires: 1, record: 100, moyenne: 80 },
        ],
        error: null,
      },
    );
    user.value = { email: "lea@example.fr" };
    await flushPromises();

    expect(wrapper.find(".jeu-side .note").exists()).toBe(false);
    expect(wrapper.findAll(".stats-table tbody tr")).toHaveLength(1);
  });

  it("vide les stats si l'utilisateur change alors qu'aucun jeu n'est chargé", async () => {
    mockGameResponse({ data: null });
    const wrapper = mountJeu({ slug: "inconnu" });
    await flushPromises();
    expect(wrapper.find(".muted").text()).toBe("Ce jeu n'existe pas.");

    user.value = { email: "lea@example.fr" };
    await flushPromises();

    expect(wrapper.find(".muted").text()).toBe("Ce jeu n'existe pas.");
  });
});
