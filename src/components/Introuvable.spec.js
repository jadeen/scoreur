import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { router } from "../router";
import Introuvable from "./Introuvable.vue";

function mountIntrouvable(props) {
  return mount(Introuvable, {
    props: {
      title: "Hors du plateau",
      message: "Cette page n'existe pas, ou plus. Le lien est peut-être mal copié.",
      primaryLabel: "Retour à l'accueil",
      primaryTo: "/",
      secondaryLabel: "Voir les jeux",
      secondaryTo: "/jeux",
      ...props,
    },
    global: { plugins: [router] },
  });
}

describe("Introuvable", () => {
  it("affiche l'eyebrow par défaut, le titre, le message et les deux actions", () => {
    const wrapper = mountIntrouvable();

    expect(wrapper.find(".label").text()).toBe("Erreur 404");
    expect(wrapper.find("h1.h1").text()).toBe("Hors du plateau");
    expect(wrapper.find(".introuvable__message").text()).toBe(
      "Cette page n'existe pas, ou plus. Le lien est peut-être mal copié.",
    );

    const actions = wrapper.findAll(".introuvable__actions .btn");
    expect(actions[0].text()).toBe("Retour à l'accueil");
    expect(actions[0].attributes("href")).toBe("#/");
    expect(actions[0].classes()).toContain("primary");
    expect(actions[1].text()).toBe("Voir les jeux");
    expect(actions[1].attributes("href")).toBe("#/jeux");
    expect(actions[1].classes()).not.toContain("primary");
  });

  it("permet de personnaliser l'eyebrow", () => {
    const wrapper = mountIntrouvable({ eyebrow: "Jeu introuvable" });

    expect(wrapper.find(".label").text()).toBe("Jeu introuvable");
  });
});
