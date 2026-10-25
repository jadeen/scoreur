import { describe, expect, it } from "vitest";
import { odinLedgerRows, odinOver, odinTotals } from "./odinScoring";

describe("odinTotals", () => {
  it("additionne les cartes de chaque manche par joueur", () => {
    const rounds = [
      [0, 4, 2],
      [3, 0, 5],
    ];
    expect(odinTotals(rounds, 3)).toEqual([3, 4, 7]);
  });

  it("vaut 0 pour tous les joueurs sans manche jouée", () => {
    expect(odinTotals([], 3)).toEqual([0, 0, 0]);
  });
});

describe("odinOver", () => {
  it("est vraie dès qu'un joueur atteint le seuil", () => {
    expect(odinOver([10, 15, 8], 15)).toBe(true);
  });

  it("est fausse tant que personne n'a atteint le seuil", () => {
    expect(odinOver([10, 12, 8], 15)).toBe(false);
  });
});

describe("odinLedgerRows", () => {
  it("donne le total cumulé et les cartes de la manche par joueur", () => {
    const rounds = [
      [0, 4],
      [3, 1],
    ];
    const rows = odinLedgerRows(rounds, 2);

    expect(rows).toEqual([
      {
        label: "1",
        cells: [
          { value: 0, detail: "0 carte" },
          { value: 4, detail: "4 cartes" },
        ],
      },
      {
        label: "2",
        cells: [
          { value: 3, detail: "3 cartes" },
          { value: 5, detail: "1 carte" },
        ],
      },
    ]);
  });
});
