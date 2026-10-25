import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import MentionsLegales from "./MentionsLegales.vue";

describe("MentionsLegales", () => {
  it("affiche l'éditeur du site et le contact", () => {
    const wrapper = mount(MentionsLegales);

    expect(wrapper.find("h1.h1").text()).toBe("Mentions légales");
    expect(wrapper.text()).toContain("jadeen");
    expect(wrapper.text()).toContain("contact@scoreur.fr");
  });
});
