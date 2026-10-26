import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import VignetteJeu from "./VignetteJeu.vue";

describe("VignetteJeu", () => {
  it("affiche l'initiale du jeu en majuscule", () => {
    const wrapper = mount(VignetteJeu, { props: { name: "wizard", color: "#2B3F86" } });
    expect(wrapper.text()).toBe("W");
  });

  it("applique la couleur du jeu en fond", () => {
    const wrapper = mount(VignetteJeu, { props: { name: "Odin", color: "#2C7FA3" } });
    expect(wrapper.attributes("style")).toContain("background: rgb(44, 127, 163)");
  });
});
