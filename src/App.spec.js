import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import App from "./App.vue";
import { router } from "./router";

describe("App", () => {
  beforeEach(async () => {
    await router.push("/");
    await router.isReady();
  });

  it("affiche le logo et l'invite de connexion dans la barre mobile", async () => {
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    const topbar = wrapper.find(".topbar");
    expect(topbar.find(".logo").text()).toBe("Scoreur");
    expect(topbar.find(".btn").text()).toBe("Se connecter");
  });

  it("affiche les liens de navigation desktop avec Accueil actif sur /", async () => {
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    const links = wrapper.findAll(".desktop-nav__inner a.link");
    expect(links.map((link) => link.text())).toEqual([
      "Accueil",
      "Jeux",
      "Mes joueurs",
      "Proposer un jeu",
    ]);
    expect(links[0].classes()).toContain("on");
    expect(links[1].classes()).not.toContain("on");
  });

  it("active le lien Jeux une fois sur /jeux", async () => {
    await router.push("/jeux");
    await router.isReady();
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    const links = wrapper.findAll(".desktop-nav__inner a.link");
    expect(links[0].classes()).not.toContain("on");
    expect(links[1].classes()).toContain("on");
  });

  it("affiche la page d'accueil via le routeur", async () => {
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    expect(wrapper.find("h1.h1").text()).toBe("Le carnet de scores de vos soirées jeux");
  });

  it("affiche une barre de retour vers l'accueil sur /jeux", async () => {
    await router.push("/jeux");
    await router.isReady();
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    const topbar = wrapper.find(".topbar--back");
    expect(topbar.find(".back-link").text()).toBe("‹ Accueil");
    expect(topbar.find(".logo").text()).toBe("Scoreur");
    expect(wrapper.findAll(".topbar")).toHaveLength(1);
  });

  it("affiche une barre de retour vers le catalogue sur /jeu/:slug", async () => {
    await router.push("/jeu/wizard");
    await router.isReady();
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    expect(wrapper.find(".topbar--back .back-link").text()).toBe("‹ Jeux");
  });
});
