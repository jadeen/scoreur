import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Classement from "./Classement.vue";

describe("Classement", () => {
  it("classe du plus haut score au plus bas et marque le premier en tête", () => {
    const wrapper = mount(Classement, {
      props: {
        players: [
          { id: 1, name: "Léa", score: 20 },
          { id: 2, name: "Hugo", score: 50 },
        ],
      },
    });

    const cards = wrapper.findAll(".st");
    expect(cards.map((card) => card.find("span").text())).toEqual(["Hugo", "Léa"]);
    expect(cards[0].classes()).toContain("lead");
    expect(cards[0].findAll("span")[1].text()).toBe("1er");
    expect(cards[1].findAll("span")[1].text()).toBe("2e");
  });

  it("marque en tête le plus petit score quand lowerWins", () => {
    const wrapper = mount(Classement, {
      props: {
        players: [
          { id: 1, name: "Léa", score: 20 },
          { id: 2, name: "Hugo", score: 5 },
        ],
        lowerWins: true,
      },
    });

    const cards = wrapper.findAll(".st");
    expect(cards[0].find("span").text()).toBe("Hugo");
    expect(cards[0].classes()).toContain("lead");
  });

  it("marque un score négatif qui n'est pas en tête", () => {
    const wrapper = mount(Classement, {
      props: {
        players: [
          { id: 1, name: "Léa", score: 20 },
          { id: 2, name: "Inès", score: -10 },
        ],
      },
    });

    const cards = wrapper.findAll(".st");
    expect(cards[1].classes()).toContain("neg");
    expect(cards[1].classes()).not.toContain("lead");
  });

  it("ne marque pas « neg » un score négatif en tête (tous négatifs)", () => {
    const wrapper = mount(Classement, {
      props: {
        players: [{ id: 1, name: "Léa", score: -5 }],
      },
    });

    const card = wrapper.find(".st");
    expect(card.classes()).toContain("lead");
    expect(card.classes()).not.toContain("neg");
  });
});
