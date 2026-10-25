import { afterEach, describe, expect, it } from "vitest";
import { clearDraft, loadDraft, saveDraft } from "./draft";

describe("brouillon de partie", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("renvoie null quand aucun brouillon n'existe", () => {
    expect(loadDraft("wizard")).toBeNull();
  });

  it("enregistre puis relit un brouillon", () => {
    const draft = { playerIds: [1, 2], scores: { 1: 10, 2: 5 }, notes: "chez Hugo" };
    saveDraft("wizard", draft);

    expect(loadDraft("wizard")).toEqual(draft);
  });

  it("isole les brouillons par jeu", () => {
    saveDraft("wizard", { playerIds: [1], scores: {}, notes: "" });
    saveDraft("odin", { playerIds: [2], scores: {}, notes: "" });

    expect(loadDraft("wizard").playerIds).toEqual([1]);
    expect(loadDraft("odin").playerIds).toEqual([2]);
  });

  it("efface un brouillon", () => {
    saveDraft("wizard", { playerIds: [1], scores: {}, notes: "" });
    clearDraft("wizard");

    expect(loadDraft("wizard")).toBeNull();
  });
});
