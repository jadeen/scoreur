import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { router } from "../router";
import { signOut, user } from "../lib/auth";
import { supabase } from "../lib/supabase";
import Compte from "./Compte.vue";

vi.mock("../lib/auth", async () => {
  const { ref } = await import("vue");
  return {
    user: ref(null),
    userDisplayName: (u) => u?.user_metadata?.full_name ?? u?.email ?? "",
    signOut: vi.fn(),
  };
});

vi.mock("../lib/supabase", () => ({
  supabase: { rpc: vi.fn() },
}));

let wrapper;

function mountCompte() {
  wrapper = mount(Compte, { global: { plugins: [router] } });
  return wrapper;
}

describe("Compte", () => {
  afterEach(async () => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.clearAllMocks();
    user.value = null;
    await router.push("/");
  });

  it("invite à se connecter quand personne n'est connecté", () => {
    mountCompte();

    expect(wrapper.find(".connect-note").text()).toBe(
      "Connecte-toi avec Google pour gérer ton compte.",
    );
    expect(wrapper.find(".who").exists()).toBe(false);
  });

  it("rappelle que les données seront remises à zéro à la version 1.0, connecté ou non", () => {
    mountCompte();
    expect(wrapper.find(".alpha-account-note").text()).toBe(
      "Version alpha : ton carnet (joueurs, parties) sera remis à zéro au passage en version 1.0.",
    );

    user.value = { email: "lea@example.fr" };
    mountCompte();
    expect(wrapper.find(".alpha-account-note").exists()).toBe(true);
  });

  it("affiche l'identité du compte connecté", () => {
    user.value = { email: "lea@example.fr", user_metadata: { full_name: "Léa Martin" } };
    mountCompte();

    expect(wrapper.find(".avatar").text()).toBe("L");
    expect(wrapper.find(".who strong").text()).toBe("Léa Martin");
    expect(wrapper.find(".who .muted").text()).toBe("Connecté avec Google · lea@example.fr");
  });

  it("se déconnecte au clic sur Se déconnecter", async () => {
    user.value = { email: "lea@example.fr" };
    mountCompte();

    await wrapper.find(".compte-layout > .btn").trigger("click");
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("propose les liens vers le carnet et les pages légales", () => {
    user.value = { email: "lea@example.fr" };
    mountCompte();

    const links = wrapper.findAll(".compte-links a");
    expect(links.map((link) => link.text())).toEqual([
      "Mes joueurs›",
      "Mentions légales›",
      "Politique de confidentialité›",
    ]);
    expect(links[0].attributes("href")).toBe("#/joueurs");
    expect(links[1].attributes("href")).toBe("#/mentions-legales");
    expect(links[2].attributes("href")).toBe("#/confidentialite");
  });

  it("demande confirmation avant de supprimer le compte, et annule sans appeler Supabase", async () => {
    user.value = { email: "lea@example.fr" };
    mountCompte();

    await wrapper.find(".btn.red").trigger("click");
    expect(wrapper.find(".confirm-delete .muted").text()).toBe(
      "Supprimer définitivement ton compte ?",
    );

    await wrapper.find(".confirm-delete-actions .btn:not(.red)").trigger("click");
    expect(wrapper.find(".confirm-delete").exists()).toBe(false);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("supprime le compte, se déconnecte puis redirige vers l'accueil", async () => {
    user.value = { email: "lea@example.fr" };
    supabase.rpc.mockResolvedValue({ error: null });
    mountCompte();

    await wrapper.find(".btn.red").trigger("click");
    await wrapper.find(".btn.red").trigger("click");
    await flushPromises();

    expect(supabase.rpc).toHaveBeenCalledWith("delete_my_account");
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("affiche un message d'erreur si la suppression échoue", async () => {
    user.value = { email: "lea@example.fr" };
    supabase.rpc.mockResolvedValue({ error: { message: "boom" } });
    mountCompte();

    await wrapper.find(".btn.red").trigger("click");
    await wrapper.find(".btn.red").trigger("click");
    await flushPromises();

    expect(wrapper.find(".error-delete").text()).toBe(
      "Impossible de supprimer ton compte pour le moment.",
    );
  });
});
