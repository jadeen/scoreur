import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FeuilleWizard from "./FeuilleWizard.vue";

const players = [
  { id: 1, name: "Léa" },
  { id: 2, name: "Hugo" },
  { id: 3, name: "Inès" },
  { id: 4, name: "Moi" },
];

function mountFeuille(props = {}) {
  return mount(FeuilleWizard, { props: { players, variant: false, ...props } });
}

describe("FeuilleWizard", () => {
  it("émet les scores et le détail initiaux au montage", () => {
    const wrapper = mountFeuille();

    expect(wrapper.emitted("update:scores")[0][0]).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 });
    expect(wrapper.emitted("update:details")[0][0]).toEqual({
      joueurs: [1, 2, 3, 4],
      premier_donneur: 0,
      variante_pas_egal: false,
      manches: [],
    });
  });

  it("affiche les joueurs dans l'ordre d'annonce, avec « Donne » sur le donneur", () => {
    const wrapper = mountFeuille();
    const rows = wrapper.findAll(".pr");

    // manche 1, 4 joueurs : donneur = joueur 0 (Léa), premier à annoncer = joueur 1 (Hugo)
    expect(rows.map((row) => row.find("strong").text())).toEqual(["Hugo", "Inès", "Moi", "Léa"]);
    expect(rows[0].find(".round-tag").text()).toBe("1re à annoncer");
    expect(rows[3].findAll(".round-tag").map((t) => t.text())).toEqual(["Donne", "4e à annoncer"]);
  });

  it("limite les annonces entre 0 et le nombre de cartes de la manche", async () => {
    const wrapper = mountFeuille();
    const minus = wrapper.findAll('button[aria-label="Moins"]')[0];
    const plus = wrapper.findAll('button[aria-label="Plus"]')[0];

    await minus.trigger("click");
    expect(wrapper.findAll("output")[0].text()).toBe("0");

    await plus.trigger("click"); // 1 carte à la manche 1 : le maximum est 1
    await plus.trigger("click");
    expect(wrapper.findAll("output")[0].text()).toBe("1");
  });

  it("refuse de valider les annonces avec la variante si le total égale le nombre de plis", async () => {
    const wrapper = mountFeuille({ variant: true });
    // manche 1 : 1 pli à prendre, une seule annonce à 1 égale ce total
    await wrapper.findAll('button[aria-label="Plus"]')[0].trigger("click");

    expect(wrapper.find(".status").classes()).toContain("warn");
    expect(wrapper.find(".status").text()).toContain("interdit");
    expect(wrapper.find(".btn.primary").attributes("disabled")).toBeDefined();
  });

  it("accepte les annonces sans variante puis demande de saisir les plis", async () => {
    const wrapper = mountFeuille();

    expect(wrapper.find(".status").classes()).toContain("ok");
    await wrapper.find(".btn.primary").trigger("click");

    expect(wrapper.find("h2.h2").text()).toBe("Plis réalisés");
    expect(wrapper.find(".status").text()).toContain("sur 1");
    expect(wrapper.find(".btn.primary").attributes("disabled")).toBeDefined();
  });

  it("revient à la phase des annonces avec « Modifier les annonces »", async () => {
    const wrapper = mountFeuille();
    await wrapper.find(".btn.primary").trigger("click"); // valider les annonces

    expect(wrapper.find("h2.h2").text()).toBe("Plis réalisés");
    await wrapper.find(".hand-actions .btn").trigger("click"); // modifier les annonces

    expect(wrapper.find("h2.h2").text()).toBe("Annonces");
  });

  it("détecte les annonces et les plis excédentaires, et reprend les annonces exactes comme plis", async () => {
    const wrapper = mountFeuille();
    const plus = wrapper.findAll('button[aria-label="Plus"]');
    const minus = wrapper.findAll('button[aria-label="Moins"]');

    // manche 1 (1 pli) : deux annonces à 1 dépassent le compte
    await plus[0].trigger("click");
    await plus[1].trigger("click");
    expect(wrapper.find(".status").text()).toContain("sur-annoncé de 1");

    // on retombe sur une seule annonce à 1 : le total tombe juste
    await minus[1].trigger("click");
    expect(wrapper.find(".status").classes()).toContain("ok");

    await wrapper.find(".btn.primary").trigger("click"); // valider les annonces
    expect(wrapper.findAll("output")[0].text()).toBe("1"); // repris comme plis par défaut

    await plus[1].trigger("click"); // un deuxième joueur prend aussi un pli
    expect(wrapper.find(".status").text()).toContain("de trop");
  });

  it("valide la manche, met à jour le classement et la feuille de score", async () => {
    const wrapper = mountFeuille();

    await wrapper.find(".btn.primary").trigger("click"); // valider les annonces (tous à 0)
    await wrapper.findAll('button[aria-label="Plus"]')[0].trigger("click"); // 1 pli pour Hugo
    await wrapper.find(".btn.primary").trigger("click"); // valider la manche

    const scoresEvents = wrapper.emitted("update:scores");
    const lastScores = scoresEvents[scoresEvents.length - 1][0];
    expect(lastScores).toEqual({ 1: 20, 2: -10, 3: 20, 4: 20 });

    const row = wrapper.findAll("tbody td")[1]; // colonne Léa, manche 1
    expect(row.find(".tot").text()).toBe("20");
  });

  it("annule la dernière manche et revient à la phase des plis", async () => {
    const wrapper = mountFeuille();
    await wrapper.find(".btn.primary").trigger("click"); // valider les annonces (tous à 0)
    await wrapper.findAll('button[aria-label="Plus"]')[0].trigger("click"); // 1 pli pour Hugo
    await wrapper.find(".btn.primary").trigger("click"); // valider la manche

    const undo = wrapper.findAll(".btn").find((btn) => btn.text() === "Annuler la dernière manche");
    expect(undo).toBeTruthy();
    await undo.trigger("click");

    expect(wrapper.find("h2.h2").text()).toBe("Plis réalisés");
    expect(wrapper.findAll("tbody tr")).toHaveLength(0);
  });

  it("reprend un brouillon de manches déjà jouées", () => {
    const wrapper = mountFeuille({
      initialDetails: {
        joueurs: [1, 2, 3, 4],
        premier_donneur: 0,
        variante_pas_egal: false,
        manches: [{ annonces: [0, 1, 0, 1], plis: [0, 1, 0, 0] }],
      },
    });

    expect(wrapper.findAll("tbody tr")).toHaveLength(1);
    expect(wrapper.find("p.muted").text()).toBe("2 cartes par joueur");
  });

  it("termine la partie et émet « fin » après la dernière manche", async () => {
    const sixPlayers = [1, 2, 3, 4, 5, 6].map((id) => ({ id, name: `J${id}` }));
    const nineRounds = Array.from({ length: 9 }, () => ({
      annonces: [0, 0, 0, 0, 0, 0],
      plis: [0, 0, 0, 0, 0, 0],
    }));
    const wrapper = mount(FeuilleWizard, {
      props: {
        players: sixPlayers,
        variant: false,
        initialDetails: {
          joueurs: sixPlayers.map((p) => p.id),
          premier_donneur: 0,
          variante_pas_egal: false,
          manches: nineRounds,
        },
      },
    });

    expect(wrapper.find("p.muted").text()).toBe("10 cartes par joueur");

    await wrapper.find(".btn.primary").trigger("click"); // valider les annonces (tous à 0)

    const plusFirstRow = wrapper.findAll('button[aria-label="Plus"]')[0];
    for (let i = 0; i < 10; i++) await plusFirstRow.trigger("click");

    await wrapper.find(".btn.primary").trigger("click"); // valider la 10e manche

    expect(wrapper.emitted("fin")).toHaveLength(1);
  });
});
