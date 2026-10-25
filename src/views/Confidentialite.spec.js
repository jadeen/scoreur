import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Confidentialite from "./Confidentialite.vue";

describe("Confidentialite", () => {
  it("affiche les droits RGPD et l'absence de cookies", () => {
    const wrapper = mount(Confidentialite);

    expect(wrapper.find("h1.h1").text()).toBe("Politique de confidentialité");
    expect(wrapper.text()).toContain("RGPD");
    expect(wrapper.text()).toContain("aucun cookie");
  });
});
