import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import App from "./App.vue";

describe("App", () => {
  it("affiche le logo et l'invite de connexion dans la barre mobile", () => {
    const wrapper = mount(App);

    const topbar = wrapper.find(".topbar");
    expect(topbar.find(".logo").text()).toBe("Scoreur");
    expect(topbar.find(".btn").text()).toBe("Se connecter");
  });

  it("affiche les liens de navigation desktop avec Accueil actif", () => {
    const wrapper = mount(App);

    const links = wrapper.findAll(".desktop-nav__inner a.link");
    expect(links.map((link) => link.text())).toEqual([
      "Accueil",
      "Jeux",
      "Mes joueurs",
      "Proposer un jeu",
    ]);
    expect(links[0].classes()).toContain("on");
    expect(links[1].classes()).not.toContain("on");
    expect(links[2].classes()).not.toContain("on");
    expect(links[3].classes()).not.toContain("on");
  });

  it("affiche le texte d'accroche et la note d'étapes à venir", () => {
    const wrapper = mount(App);

    expect(wrapper.find("h1.h1").text()).toBe("Le carnet de scores de vos soirées jeux");
    expect(wrapper.find("p.muted").text()).toBe(
      "Notez chaque partie, voyez qui gagne le plus, et revoyez toutes les feuilles de score.",
    );
    expect(wrapper.find(".note").text()).toBe(
      "Catalogue, connexion et parties arrivent dans les prochaines étapes.",
    );
  });
});
