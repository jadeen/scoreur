import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import { signInWithGoogle } from "../lib/auth";
import { router } from "../router";
import ConnexionRequise from "./ConnexionRequise.vue";

vi.mock("../lib/auth", () => ({ signInWithGoogle: vi.fn() }));

describe("ConnexionRequise", () => {
  it("affiche le titre, le message, et déclenche la connexion Google", async () => {
    const wrapper = mount(ConnexionRequise, {
      props: { title: "Carnet privé", message: "Connecte-toi avec Google pour continuer." },
      global: { plugins: [router] },
    });

    expect(wrapper.find(".label").text()).toBe("Connexion requise");
    expect(wrapper.find("h1.h1").text()).toBe("Carnet privé");
    expect(wrapper.find(".introuvable__message").text()).toBe(
      "Connecte-toi avec Google pour continuer.",
    );

    const actions = wrapper.findAll(".introuvable__actions .btn");
    expect(actions[0].text()).toBe("Se connecter");
    await actions[0].trigger("click");
    expect(signInWithGoogle).toHaveBeenCalledTimes(1);
    expect(actions[1].text()).toBe("Retour à l'accueil");
    expect(actions[1].attributes("href")).toBe("#/");
  });
});
