import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { user } from "../lib/auth";
import { supabase } from "../lib/supabase";
import Joueurs from "./Joueurs.vue";

vi.mock("../lib/auth", async () => {
  const { ref } = await import("vue");
  return { user: ref(null) };
});

vi.mock("../lib/supabase", () => ({
  supabase: { from: vi.fn() },
}));

function mockPlayersTable({ select, insert, update } = {}) {
  supabase.from.mockReturnValue({
    select: () => ({
      order: () => Promise.resolve(select ?? { data: [], error: null }),
    }),
    insert: (values) => Promise.resolve(insert ? insert(values) : { error: null }),
    update: (values) => ({
      eq: (_column, id) => Promise.resolve(update ? update(values, id) : { error: null }),
    }),
  });
}

// Nouvelle copie à chaque appel : les joueurs sont mutés en place par le
// composant (renommage, « moi »), il ne faut jamais partager les objets d'un test à l'autre.
function makePlayers() {
  return [
    { id: 1, name: "Hugo", is_me: false },
    { id: 2, name: "Léa", is_me: false },
    { id: 3, name: "Moi", is_me: true },
  ];
}

let wrapper;

describe("Joueurs", () => {
  afterEach(() => {
    wrapper?.unmount();
    wrapper = undefined;
    vi.clearAllMocks();
    user.value = null;
  });

  it("invite à se connecter quand personne n'est connecté", () => {
    mockPlayersTable({ select: { data: makePlayers(), error: null } });
    wrapper = mount(Joueurs);

    expect(wrapper.find(".note").text()).toBe(
      "Connecte-toi avec Google pour gérer ton carnet de joueurs.",
    );
    expect(wrapper.find(".add").exists()).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("affiche un état de chargement avant la réponse de Supabase", () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({ select: { data: makePlayers(), error: null } });
    wrapper = mount(Joueurs);

    expect(wrapper.find(".state-loading").text()).toBe("Chargement du carnet…");
  });

  it("affiche la liste des joueurs, « moi » en tête avec son badge", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({ select: { data: makePlayers(), error: null } });
    wrapper = mount(Joueurs);
    await flushPromises();

    const items = wrapper.findAll(".item");
    expect(items).toHaveLength(3);
    expect(items[0].find("strong").text()).toBe("Moimoi");
    expect(items[0].find(".badge").text()).toBe("moi");
    expect(items[1].find("strong").text()).toBe("Hugo");
    expect(items[2].find("strong").text()).toBe("Léa");
  });

  it("affiche un message quand le carnet est vide", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({ select: { data: [], error: null } });
    wrapper = mount(Joueurs);
    await flushPromises();

    expect(wrapper.find(".state-empty").text()).toBe("Ton carnet est vide pour l'instant.");
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({ select: { data: null, error: { message: "boom" } } });
    wrapper = mount(Joueurs);
    await flushPromises();

    expect(wrapper.find(".state-error").text()).toBe(
      "Impossible de charger ton carnet pour le moment.",
    );
  });

  it("vide le carnet et affiche l'invite de connexion quand l'utilisateur se déconnecte", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({ select: { data: makePlayers(), error: null } });
    wrapper = mount(Joueurs);
    await flushPromises();
    expect(wrapper.findAll(".item")).toHaveLength(3);

    user.value = null;
    await flushPromises();

    expect(wrapper.find(".note").text()).toBe(
      "Connecte-toi avec Google pour gérer ton carnet de joueurs.",
    );
  });

  it("ajoute un joueur et recharge le carnet", async () => {
    user.value = { email: "lea@example.fr" };
    let loaded = makePlayers();
    const insert = vi.fn((values) => {
      loaded = [...loaded, { id: 4, name: values.name, is_me: false }];
      return { error: null };
    });
    supabase.from.mockReturnValue({
      select: () => ({ order: () => Promise.resolve({ data: loaded, error: null }) }),
      insert,
    });
    wrapper = mount(Joueurs);
    await flushPromises();

    await wrapper.find('input[aria-label="Nom du joueur"]').setValue("Tom");
    await wrapper.find(".add").trigger("submit");
    await flushPromises();

    expect(insert).toHaveBeenCalledWith({ name: "Tom" });
    expect(wrapper.findAll(".item")).toHaveLength(4);
    expect(wrapper.find('input[aria-label="Nom du joueur"]').element.value).toBe("");
  });

  it("ne tente pas d'ajouter un nom vide ou fait seulement d'espaces", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({ select: { data: makePlayers(), error: null } });
    wrapper = mount(Joueurs);
    await flushPromises();
    supabase.from.mockClear();

    const input = wrapper.find('input[aria-label="Nom du joueur"]');
    input.element.value = "   ";
    await input.trigger("input");
    await wrapper.find(".add").trigger("submit");
    await flushPromises();

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("affiche un message quand le nom existe déjà à l'ajout", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({
      select: { data: makePlayers(), error: null },
      insert: () => ({ error: { code: "23505" } }),
    });
    wrapper = mount(Joueurs);
    await flushPromises();

    await wrapper.find('input[aria-label="Nom du joueur"]').setValue("Léa");
    await wrapper.find(".add").trigger("submit");
    await flushPromises();

    expect(wrapper.find(".error-add").text()).toBe("Ce nom existe déjà dans ton carnet.");
  });

  it("affiche un message générique quand l'ajout échoue pour une autre raison", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({
      select: { data: makePlayers(), error: null },
      insert: () => ({ error: { code: "500" } }),
    });
    wrapper = mount(Joueurs);
    await flushPromises();

    await wrapper.find('input[aria-label="Nom du joueur"]').setValue("Tom");
    await wrapper.find(".add").trigger("submit");
    await flushPromises();

    expect(wrapper.find(".error-add").text()).toBe("Impossible d'enregistrer pour le moment.");
  });

  it("renomme un joueur", async () => {
    user.value = { email: "lea@example.fr" };
    const update = vi.fn(() => ({ error: null }));
    mockPlayersTable({ select: { data: makePlayers(), error: null }, update });
    wrapper = mount(Joueurs);
    await flushPromises();

    const hugoItem = wrapper.findAll(".item")[1];
    await hugoItem.find(".lk").trigger("click");
    await hugoItem.find('input[aria-label="Nouveau nom du joueur"]').setValue("Hugo B.");
    await hugoItem.find(".rename").trigger("submit");
    await flushPromises();

    expect(update).toHaveBeenCalledWith({ name: "Hugo B." }, 1);
    expect(wrapper.findAll(".item")[1].find("strong").text()).toBe("Hugo B.");
  });

  it("ne tente pas de renommer avec un nom vide ou fait seulement d'espaces", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({ select: { data: makePlayers(), error: null } });
    wrapper = mount(Joueurs);
    await flushPromises();
    supabase.from.mockClear();

    const hugoItem = wrapper.findAll(".item")[1];
    await hugoItem.find(".lk").trigger("click");
    const input = hugoItem.find('input[aria-label="Nouveau nom du joueur"]');
    input.element.value = "   ";
    await input.trigger("input");
    await hugoItem.find(".rename").trigger("submit");
    await flushPromises();

    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("annule un renommage sans appeler Supabase", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({ select: { data: makePlayers(), error: null } });
    wrapper = mount(Joueurs);
    await flushPromises();
    supabase.from.mockClear();

    const hugoItem = wrapper.findAll(".item")[1];
    await hugoItem.find(".lk").trigger("click");
    const buttons = hugoItem.findAll(".lk");
    await buttons[buttons.length - 1].trigger("click");

    expect(wrapper.findAll(".item")[1].find("strong").text()).toBe("Hugo");
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("affiche un message d'erreur si le renommage échoue", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({
      select: { data: makePlayers(), error: null },
      update: () => ({ error: { code: "23505" } }),
    });
    wrapper = mount(Joueurs);
    await flushPromises();

    const hugoItem = wrapper.findAll(".item")[1];
    await hugoItem.find(".lk").trigger("click");
    await hugoItem.find('input[aria-label="Nouveau nom du joueur"]').setValue("Léa");
    await hugoItem.find(".rename").trigger("submit");
    await flushPromises();

    expect(wrapper.find(".error-rename").text()).toBe("Ce nom existe déjà dans ton carnet.");
  });

  it("marque un joueur comme « moi » et retire le badge de l'ancien", async () => {
    user.value = { email: "lea@example.fr" };
    const update = vi.fn(() => ({ error: null }));
    mockPlayersTable({ select: { data: makePlayers(), error: null }, update });
    wrapper = mount(Joueurs);
    await flushPromises();

    const hugoItem = wrapper.findAll(".item")[1];
    await hugoItem.findAll(".lk")[1].trigger("click");
    await flushPromises();

    expect(update).toHaveBeenCalledWith({ is_me: false }, 3);
    expect(update).toHaveBeenCalledWith({ is_me: true }, 1);
    // Hugo passe en tête (is_me) : le tri se refait au prochain rendu.
    const items = wrapper.findAll(".item");
    expect(items[0].find("strong").text()).toBe("Hugomoi");
    expect(items.map((item) => item.findAll(".badge")).flat()).toHaveLength(1);
  });

  it("marque directement « moi » quand personne ne l'était", async () => {
    user.value = { email: "lea@example.fr" };
    const noMoi = [
      { id: 1, name: "Hugo", is_me: false },
      { id: 2, name: "Léa", is_me: false },
    ];
    const update = vi.fn(() => ({ error: null }));
    mockPlayersTable({ select: { data: noMoi, error: null }, update });
    wrapper = mount(Joueurs);
    await flushPromises();

    const hugoItem = wrapper.findAll(".item")[0];
    await hugoItem.findAll(".lk")[1].trigger("click");
    await flushPromises();

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith({ is_me: true }, 1);
  });

  it("n'affiche pas « Marquer comme moi » pour le joueur déjà « moi »", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({ select: { data: makePlayers(), error: null } });
    wrapper = mount(Joueurs);
    await flushPromises();

    const moiItem = wrapper.findAll(".item")[0];
    expect(moiItem.findAll(".lk").map((btn) => btn.text())).toEqual(["Renommer"]);
  });

  it("affiche un message d'erreur si le retrait du précédent « moi » échoue", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({
      select: { data: makePlayers(), error: null },
      update: (values) => ({ error: values.is_me === false ? { code: "500" } : null }),
    });
    wrapper = mount(Joueurs);
    await flushPromises();

    const hugoItem = wrapper.findAll(".item")[1];
    await hugoItem.findAll(".lk")[1].trigger("click");
    await flushPromises();

    expect(wrapper.find(".error-moi").text()).toBe("Impossible d'enregistrer pour le moment.");
  });

  it("affiche un message d'erreur si le marquage « moi » échoue", async () => {
    user.value = { email: "lea@example.fr" };
    mockPlayersTable({
      select: { data: makePlayers(), error: null },
      update: (values) => ({ error: values.is_me === true ? { code: "500" } : null }),
    });
    wrapper = mount(Joueurs);
    await flushPromises();

    const hugoItem = wrapper.findAll(".item")[1];
    await hugoItem.findAll(".lk")[1].trigger("click");
    await flushPromises();

    expect(wrapper.find(".error-moi").text()).toBe("Impossible d'enregistrer pour le moment.");
  });
});
