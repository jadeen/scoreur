import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FeuilleOdin from "./FeuilleOdin.vue";

const players = [
  { id: 1, name: "Léa" },
  { id: 2, name: "Hugo" },
  { id: 3, name: "Moi" },
];

function mountFeuille(props = {}) {
  return mount(FeuilleOdin, { props: { players, target: 15, ...props } });
}

describe("FeuilleOdin", () => {
  it("émet les scores et le détail initiaux au montage", () => {
    const wrapper = mountFeuille();

    expect(wrapper.emitted("update:scores")[0][0]).toEqual({ 1: 0, 2: 0, 3: 0 });
    expect(wrapper.emitted("update:details")[0][0]).toEqual({
      joueurs: [1, 2, 3],
      seuil: 15,
      manches: [],
    });
  });

  it("affiche un joueur par ligne avec un stepper de cartes", () => {
    const wrapper = mountFeuille();
    const rows = wrapper.findAll(".pr");

    expect(rows.map((row) => row.find("span").text())).toEqual(["Léa", "Hugo", "Moi"]);
    expect(wrapper.findAll("output").map((o) => o.text())).toEqual(["0", "0", "0"]);
  });

  it("limite les cartes entre 0 et 9", async () => {
    const wrapper = mountFeuille();
    const minus = wrapper.findAll('button[aria-label="Moins"]')[0];
    const plus = wrapper.findAll('button[aria-label="Plus"]')[0];

    await minus.trigger("click");
    expect(wrapper.findAll("output")[0].text()).toBe("0");

    for (let i = 0; i < 12; i++) await plus.trigger("click");
    expect(wrapper.findAll("output")[0].text()).toBe("9");
  });

  it("met en évidence un joueur qui a vidé sa main", async () => {
    const wrapper = mountFeuille();
    expect(wrapper.findAll(".pr span")[0].classes()).toContain("odin-empty");

    await wrapper.findAll('button[aria-label="Plus"]')[0].trigger("click");
    expect(wrapper.findAll(".pr span")[0].classes()).not.toContain("odin-empty");
  });

  it("valide une manche, met à jour le classement et la feuille de score", async () => {
    const wrapper = mountFeuille();
    await wrapper.findAll('button[aria-label="Plus"]')[0].trigger("click");
    await wrapper.find(".btn.primary").trigger("click");

    const scoresEvents = wrapper.emitted("update:scores");
    expect(scoresEvents[scoresEvents.length - 1][0]).toEqual({ 1: 1, 2: 0, 3: 0 });

    const cells = wrapper.findAll("tbody td");
    expect(cells[1].find(".tot").text()).toBe("1");
    expect(cells[1].find("small").text()).toBe("1 carte");
  });

  it("annule la dernière manche et reprend sa saisie", async () => {
    const wrapper = mountFeuille();
    await wrapper.findAll('button[aria-label="Plus"]')[0].trigger("click");
    await wrapper.find(".btn.primary").trigger("click");

    expect(wrapper.findAll("tbody tr")).toHaveLength(1);
    const undo = wrapper.findAll(".btn").find((btn) => btn.text() === "Annuler la dernière manche");
    await undo.trigger("click");

    expect(wrapper.findAll("tbody tr")).toHaveLength(0);
    expect(wrapper.findAll("output")[0].text()).toBe("1");
  });

  it("reprend un brouillon de manches déjà jouées", () => {
    const wrapper = mountFeuille({
      initialDetails: { joueurs: [1, 2, 3], seuil: 15, manches: [[0, 4, 2]] },
    });

    expect(wrapper.findAll("tbody tr")).toHaveLength(1);
  });

  it("termine la partie et émet « fin » quand un joueur atteint le seuil", async () => {
    const wrapper = mountFeuille({
      target: 5,
      initialDetails: { joueurs: [1, 2, 3], seuil: 5, manches: [[4, 0, 0]] },
    });

    await wrapper.findAll('button[aria-label="Plus"]')[0].trigger("click");
    await wrapper.find(".btn.primary").trigger("click");

    expect(wrapper.emitted("fin")).toHaveLength(1);
  });
});
