import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import Accueil from "./Accueil.vue";

describe("Accueil", () => {
  it("affiche le texte d'accroche et la note d'étapes à venir", () => {
    const wrapper = mount(Accueil);

    expect(wrapper.find("h1.h1").text()).toBe("Le carnet de scores de vos soirées jeux");
    expect(wrapper.find("p.muted").text()).toBe(
      "Notez chaque partie, voyez qui gagne le plus, et revoyez toutes les feuilles de score.",
    );
    expect(wrapper.find(".note").text()).toBe(
      "Connexion et parties arrivent dans les prochaines étapes.",
    );
  });
});
