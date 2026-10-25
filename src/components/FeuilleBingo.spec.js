import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import FeuilleBingo from "./FeuilleBingo.vue";

const CARD = [
  [8, 0, 20, 0, 0, 56, 0, 72, 82],
  [0, 15, 0, 34, 49, 0, 63, 77, 0],
  [0, 0, 28, 35, 0, 59, 68, 0, 89],
];

const players = [{ id: 1, name: "Moi" }];

function mountFeuille(props = {}) {
  return mount(FeuilleBingo, { props: { players, card: CARD, ...props } });
}

function ball(wrapper, n) {
  return wrapper.findAll(".bingo-ball")[n - 1];
}

async function drawNumber(wrapper, n) {
  await ball(wrapper, n).trigger("click");
}

describe("FeuilleBingo", () => {
  it("émet les scores et le détail initiaux au montage", () => {
    const wrapper = mountFeuille();

    expect(wrapper.emitted("update:scores")[0][0]).toEqual({ 1: 0 });
    expect(wrapper.emitted("update:details")[0][0]).toEqual({
      carton: CARD,
      tirage: [],
      gagne: { quine: false, double_quine: false, carton_plein: false },
    });
  });

  it("affiche le carton, les 3 lignes de statut, les paliers et les 90 numéros", () => {
    const wrapper = mountFeuille();
    expect(wrapper.findAll(".carton-cell")).toHaveLength(27);
    expect(wrapper.findAll(".row")).toHaveLength(6);
    expect(wrapper.findAll(".row")[0].text()).toContain("reste 5 : 8, 20, 56, 72, 82");
    expect(wrapper.findAll(".bingo-ball")).toHaveLength(90);
  });

  it("marque d'un cerclage les numéros du carton sur le tableau", () => {
    const wrapper = mountFeuille();
    expect(ball(wrapper, 8).classes()).toContain("mine");
    expect(ball(wrapper, 1).classes()).not.toContain("mine");
  });

  it("tire un numéro présent sur le carton et met à jour la ligne", async () => {
    const wrapper = mountFeuille();
    await drawNumber(wrapper, 8);

    expect(wrapper.text()).toContain("8 : il est sur ton carton !");
    expect(wrapper.findAll(".row")[0].text()).toContain("reste 4 : 20, 56, 72, 82");
    expect(ball(wrapper, 8).classes()).toContain("on");
  });

  it("tire un numéro absent du carton", async () => {
    const wrapper = mountFeuille();
    await drawNumber(wrapper, 1);

    expect(wrapper.text()).toContain("1 : pas sur ton carton.");
  });

  it("retire un numéro déjà tiré en cliquant à nouveau dessus", async () => {
    const wrapper = mountFeuille();
    await drawNumber(wrapper, 8);
    await drawNumber(wrapper, 8);

    expect(wrapper.text()).toContain("8 retiré.");
    expect(ball(wrapper, 8).classes()).not.toContain("on");
  });

  it("annule le dernier numéro tiré", async () => {
    const wrapper = mountFeuille();
    await drawNumber(wrapper, 8);
    await wrapper.find(".btn.sm").trigger("click");

    expect(wrapper.text()).toContain("8 annulé.");
    expect(wrapper.find(".row").text()).toContain("reste 5");
  });

  it("ne propose pas d'annuler sans numéro tiré", () => {
    const wrapper = mountFeuille();
    expect(wrapper.find(".btn.sm").exists()).toBe(false);
  });

  it("gagne automatiquement la quine dès qu'une ligne est complète", async () => {
    const wrapper = mountFeuille();
    for (const n of [8, 20, 56, 72, 82]) await drawNumber(wrapper, n);

    expect(wrapper.findAll(".row")[0].classes()).toContain("bingo-complete");
    const tierRows = wrapper.findAll(".row").slice(3);
    expect(tierRows[0].text()).toContain("Quine");
    expect(tierRows[0].text()).toContain("Gagné");
    expect(tierRows[0].classes()).toContain("bingo-complete");
    expect(tierRows[1].text()).toContain("Pas encore");

    const scoresEvents = wrapper.emitted("update:scores");
    expect(scoresEvents[scoresEvents.length - 1][0]).toEqual({ 1: 1 });
    const detailsEvents = wrapper.emitted("update:details");
    expect(detailsEvents[detailsEvents.length - 1][0].gagne.quine).toBe(true);
  });

  it("émet « fin » en cliquant sur Terminer la partie", async () => {
    const wrapper = mountFeuille();
    await wrapper.find(".hand-actions .btn.primary").trigger("click");

    expect(wrapper.emitted("fin")).toHaveLength(1);
  });

  it("reprend un brouillon avec son tirage, les paliers recalculés automatiquement", () => {
    const wrapper = mountFeuille({
      initialDetails: {
        carton: CARD,
        tirage: [8, 20, 56, 72, 82],
        gagne: { quine: true, double_quine: false, carton_plein: false },
      },
    });

    expect(wrapper.find(".muted").text()).toBe("5 numéros tirés");
    expect(wrapper.findAll(".row")[0].classes()).toContain("bingo-complete");
    expect(wrapper.findAll(".row").slice(3)[0].text()).toContain("Gagné");
  });
});
