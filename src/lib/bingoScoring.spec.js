import { describe, expect, it } from "vitest";
import {
  bingoCardIsValid,
  bingoCardIssues,
  bingoCardNumbers,
  bingoCompletedRows,
  bingoRowStatus,
  bingoScore,
  bingoTiers,
  emptyCard,
} from "./bingoScoring";

const CARD = [
  [8, 0, 20, 0, 0, 56, 0, 72, 82],
  [0, 15, 0, 34, 49, 0, 63, 77, 0],
  [0, 0, 28, 35, 0, 59, 68, 0, 89],
];

describe("emptyCard", () => {
  it("donne un carton de 3 lignes de 9 cases vides", () => {
    expect(emptyCard()).toEqual([Array(9).fill(null), Array(9).fill(null), Array(9).fill(null)]);
  });
});

describe("bingoCardNumbers", () => {
  it("liste les 15 numéros du carton, sans les cases vides", () => {
    expect(bingoCardNumbers(CARD)).toEqual([
      8, 20, 56, 72, 82, 15, 34, 49, 63, 77, 28, 35, 59, 68, 89,
    ]);
  });
});

describe("bingoCardIssues", () => {
  it("ne remonte aucun problème pour un carton valide", () => {
    expect(bingoCardIssues(CARD)).toEqual([]);
    expect(bingoCardIsValid(CARD)).toBe(true);
  });

  it("signale une ligne qui n'a pas 5 numéros", () => {
    const card = emptyCard();
    card[0] = [1, 2, 3, 0, 0, 0, 0, 0, 0];
    expect(bingoCardIssues(card)).toContain("La ligne 1 doit avoir 5 numéros (actuellement 3).");
    expect(bingoCardIsValid(card)).toBe(false);
  });

  it("signale un numéro hors de 1 à 90", () => {
    const card = [...CARD];
    card[0] = [8, 0, 20, 0, 0, 56, 0, 72, 91];
    expect(bingoCardIssues(card)).toContain("Les numéros doivent être entre 1 et 90.");
  });

  it("signale un numéro en double", () => {
    const card = [...CARD];
    card[2] = [0, 0, 28, 35, 0, 59, 68, 0, 8];
    expect(bingoCardIssues(card)).toContain("Le carton contient des numéros en double.");
  });
});

describe("bingoRowStatus", () => {
  it("donne les numéros sortis, restants, et si la ligne est complète", () => {
    const status = bingoRowStatus(CARD[0], [8, 72, 56]);
    expect(status.numbers).toEqual([8, 20, 56, 72, 82]);
    expect(status.hit).toEqual([8, 56, 72]);
    expect(status.remaining).toEqual([20, 82]);
    expect(status.complete).toBe(false);
  });

  it("est complète quand tous les numéros de la ligne sont sortis", () => {
    const status = bingoRowStatus(CARD[0], [8, 20, 56, 72, 82]);
    expect(status.complete).toBe(true);
    expect(status.remaining).toEqual([]);
  });
});

describe("bingoCompletedRows", () => {
  it("compte les lignes complètes", () => {
    expect(bingoCompletedRows(CARD, [])).toBe(0);
    expect(bingoCompletedRows(CARD, [8, 20, 56, 72, 82])).toBe(1);
    expect(bingoCompletedRows(CARD, [8, 20, 56, 72, 82, 15, 34, 49, 63, 77])).toBe(2);
  });
});

describe("bingoTiers", () => {
  it("ne gagne aucun palier sans ligne complète", () => {
    expect(bingoTiers(0)).toEqual({ quine: false, double_quine: false, carton_plein: false });
  });

  it("gagne la quine dès 1 ligne complète", () => {
    expect(bingoTiers(1)).toEqual({ quine: true, double_quine: false, carton_plein: false });
  });

  it("gagne la double quine dès 2 lignes complètes", () => {
    expect(bingoTiers(2)).toEqual({ quine: true, double_quine: true, carton_plein: false });
  });

  it("gagne le carton plein à 3 lignes complètes", () => {
    expect(bingoTiers(3)).toEqual({ quine: true, double_quine: true, carton_plein: true });
  });
});

describe("bingoScore", () => {
  it("compte les paliers gagnés", () => {
    expect(bingoScore({ quine: false, double_quine: false, carton_plein: false })).toBe(0);
    expect(bingoScore({ quine: true, double_quine: false, carton_plein: false })).toBe(1);
    expect(bingoScore({ quine: true, double_quine: true, carton_plein: true })).toBe(3);
  });
});
