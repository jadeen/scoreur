import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import TableauManches from "./TableauManches.vue";

const players = [
  { id: 1, name: "Léa" },
  { id: 2, name: "Hugo" },
];

describe("TableauManches", () => {
  it("affiche un message quand il n'y a encore aucune manche", () => {
    const wrapper = mount(TableauManches, { props: { players, rows: [] } });

    expect(wrapper.find(".empty").text()).toBe("Les scores de chaque manche s'afficheront ici.");
    expect(wrapper.find("table").exists()).toBe(false);
  });

  it("affiche une ligne par manche avec le total cumulé et le détail", () => {
    const rows = [
      {
        label: "1",
        cells: [
          { value: 20, detail: "0/0 · +20", negative: false },
          { value: -10, detail: "1/0 · −10", negative: true },
        ],
      },
    ];
    const wrapper = mount(TableauManches, { props: { players, rows } });

    const headers = wrapper.findAll("th");
    expect(headers.map((th) => th.text())).toEqual(["Manche", "Léa", "Hugo"]);

    const cells = wrapper.findAll("tbody td");
    expect(cells[0].text()).toBe("1");
    expect(cells[1].find(".tot").text()).toBe("20");
    expect(cells[1].find("small").text()).toBe("0/0 · +20");
    expect(cells[1].classes()).not.toContain("neg");
    expect(cells[2].find(".tot").text()).toBe("-10");
    expect(cells[2].find("small").text()).toBe("1/0 · −10");
    expect(cells[2].classes()).toContain("neg");
  });
});
