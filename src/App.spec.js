import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.vue";
import { signInWithGoogle, user } from "./lib/auth";
import { router } from "./router";

vi.mock("./lib/auth", async (importOriginal) => {
  const { ref } = await import("vue");
  const actual = await importOriginal();
  return { ...actual, user: ref(null), signInWithGoogle: vi.fn() };
});

describe("App", () => {
  beforeEach(async () => {
    user.value = null;
    signInWithGoogle.mockClear();
    localStorage.clear();
    await router.push("/");
    await router.isReady();
  });

  it("affiche le logo et l'invite de connexion dans la barre mobile", async () => {
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    const topbar = wrapper.find(".topbar");
    expect(topbar.find(".logo img").attributes("alt")).toBe("Scoreur");
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
      "Historique",
      "Proposer un jeu",
    ]);
    expect(links[0].classes()).toContain("on");
    expect(links[1].classes()).not.toContain("on");
  });

  it("ouvre la page Mes joueurs via le lien de nav desktop", async () => {
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    const link = wrapper
      .findAll(".desktop-nav__inner a.link")
      .find((a) => a.text() === "Mes joueurs");
    await link.trigger("click");
    await flushPromises();
    expect(wrapper.find("h1.h1").text()).toBe("Mes joueurs");
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
    expect(topbar.find(".logo img").attributes("alt")).toBe("Scoreur");
    expect(wrapper.findAll(".topbar")).toHaveLength(1);
  });

  it("affiche une barre de retour vers le catalogue sur /jeu/:slug", async () => {
    await router.push("/jeu/wizard");
    await router.isReady();
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    expect(wrapper.find(".topbar--back .back-link").text()).toBe("‹ Jeux");
  });

  it("déclenche la connexion Google au clic sur Se connecter, mobile et desktop", async () => {
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    await wrapper.find(".topbar .btn").trigger("click");
    await wrapper.find(".desktop-nav .btn").trigger("click");
    expect(signInWithGoogle).toHaveBeenCalledTimes(2);
  });

  it("affiche l'avatar lié à Mon compte une fois connecté, mobile et desktop", async () => {
    user.value = { email: "lea@example.fr", user_metadata: { full_name: "Léa Martin" } };
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    const topbarWho = wrapper.find(".topbar .who");
    expect(topbarWho.find(".avatar").text()).toBe("L");
    expect(topbarWho.attributes("href")).toBe("#/compte");

    const navWho = wrapper.find(".desktop-nav .who");
    expect(navWho.find(".avatar").text()).toBe("L");
    expect(navWho.attributes("href")).toBe("#/compte");
  });

  it("affiche le bandeau alpha et le masque durablement au clic sur fermer", async () => {
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    expect(wrapper.find(".alpha-banner").text()).toContain("Version alpha");

    await wrapper.find(".alpha-banner__close").trigger("click");
    expect(wrapper.find(".alpha-banner").exists()).toBe(false);

    const reloaded = mount(App, { global: { plugins: [router] } });
    await router.isReady();
    expect(reloaded.find(".alpha-banner").exists()).toBe(false);
  });

  it("affiche les liens de mentions légales et confidentialité en pied de page", async () => {
    const wrapper = mount(App, { global: { plugins: [router] } });
    await router.isReady();

    const links = wrapper.findAll(".footer a");
    expect(links.map((link) => link.text())).toEqual([
      "Mentions légales",
      "Politique de confidentialité",
    ]);
  });
});
