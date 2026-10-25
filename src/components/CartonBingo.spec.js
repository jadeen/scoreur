import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import CartonBingo from "./CartonBingo.vue";

const CARD = [
  [8, 0, 20, 0, 0, 56, 0, 72, 82],
  [0, 15, 0, 34, 49, 0, 63, 77, 0],
  [0, 0, 28, 35, 0, 59, 68, 0, 89],
];

describe("CartonBingo", () => {
  it("affiche les 3 lignes de 9 cases, vides ou numérotées", () => {
    const wrapper = mount(CartonBingo, { props: { card: CARD } });

    const rows = wrapper.findAll(".carton-row");
    expect(rows).toHaveLength(3);
    expect(rows[0].findAll(".carton-cell")).toHaveLength(9);
    expect(rows[0].findAll(".carton-cell.blank")).toHaveLength(4);
    expect(rows[0].findAll(".carton-cell").map((cell) => cell.text())).toEqual([
      "8",
      "",
      "20",
      "",
      "",
      "56",
      "",
      "72",
      "82",
    ]);
  });

  it("met en évidence les numéros sortis", () => {
    const wrapper = mount(CartonBingo, { props: { card: CARD, tirage: [8, 72] } });

    const cells = wrapper.findAll(".carton-row")[0].findAll(".carton-cell");
    expect(cells[0].classes()).toContain("hit");
    expect(cells[7].classes()).toContain("hit");
    expect(cells[2].classes()).not.toContain("hit");
  });

  it("n'a pas de numéro sorti par défaut", () => {
    const wrapper = mount(CartonBingo, { props: { card: CARD } });
    expect(wrapper.findAll(".carton-cell.hit")).toHaveLength(0);
  });
});
