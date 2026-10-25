import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import BandeauFin from "./BandeauFin.vue";

function makePlayers() {
  return [
    { id: 1, name: "Léa", score: 210 },
    { id: 2, name: "Moi", score: 180 },
    { id: 3, name: "Hugo", score: 150 },
  ];
}

describe("BandeauFin", () => {
  it("affiche le vainqueur unique et le classement final", () => {
    const wrapper = mount(BandeauFin, { props: { players: makePlayers() } });

    expect(wrapper.find(".win .muted").text()).toBe("Vainqueur");
    expect(wrapper.find(".win strong").text()).toBe("Léa");
    expect(wrapper.findAll(".win .muted")[1].text()).toBe("210 points");

    const rows = wrapper.findAll(".rk");
    expect(rows.map((row) => row.find(".n").text())).toEqual(["1", "2", "3"]);
    expect(rows.map((row) => row.find(".p").text())).toEqual(["210", "180", "150"]);
  });

  it("affiche « Vainqueurs » au pluriel en cas d'égalité", () => {
    const wrapper = mount(BandeauFin, {
      props: {
        players: [
          { id: 1, name: "Léa", score: 50 },
          { id: 2, name: "Hugo", score: 50 },
        ],
      },
    });

    expect(wrapper.find(".win .muted").text()).toBe("Vainqueurs");
    expect(wrapper.find(".win strong").text()).toBe("Léa, Hugo");
  });

  it("respecte lowerWins pour désigner le vainqueur", () => {
    const wrapper = mount(BandeauFin, {
      props: {
        players: [
          { id: 1, name: "Léa", score: 20 },
          { id: 2, name: "Hugo", score: 5 },
        ],
        lowerWins: true,
      },
    });

    expect(wrapper.find(".win strong").text()).toBe("Hugo");
  });

  it("émet save avec la note saisie", async () => {
    const wrapper = mount(BandeauFin, { props: { players: makePlayers() } });

    await wrapper.find("#notes-fin").setValue("chez Hugo");
    await wrapper.find(".btn.primary").trigger("click");

    expect(wrapper.emitted("save")).toEqual([["chez Hugo"]]);
  });

  it("émet abandon au clic sur abandonner", async () => {
    const wrapper = mount(BandeauFin, { props: { players: makePlayers() } });

    await wrapper.findAll(".btn")[1].trigger("click");

    expect(wrapper.emitted("abandon")).toEqual([[]]);
  });

  it("désactive les actions et change le texte pendant l'enregistrement", () => {
    const wrapper = mount(BandeauFin, { props: { players: makePlayers(), saving: true } });

    const buttons = wrapper.findAll(".btn");
    expect(buttons[0].text()).toBe("Enregistrement…");
    expect(buttons[0].attributes("disabled")).toBeDefined();
    expect(buttons[1].attributes("disabled")).toBeDefined();
  });
});
