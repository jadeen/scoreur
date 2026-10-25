import { describe, expect, it } from "vitest";
import { rankPlayers } from "./ranking";

describe("rankPlayers", () => {
  it("classe du plus haut score au plus bas par défaut", () => {
    const ranked = rankPlayers(
      [
        { id: 1, score: 20 },
        { id: 2, score: 50 },
        { id: 3, score: 30 },
      ],
      false,
    );

    expect(ranked.map((p) => p.id)).toEqual([2, 3, 1]);
    expect(ranked.map((p) => p.rank)).toEqual([1, 2, 3]);
    expect(ranked.map((p) => p.isWinner)).toEqual([true, false, false]);
  });

  it("classe du plus bas score au plus haut quand lowerWins", () => {
    const ranked = rankPlayers(
      [
        { id: 1, score: 20 },
        { id: 2, score: 5 },
        { id: 3, score: 30 },
      ],
      true,
    );

    expect(ranked.map((p) => p.id)).toEqual([2, 1, 3]);
    expect(ranked.map((p) => p.rank)).toEqual([1, 2, 3]);
  });

  it("attribue le même rang aux ex-aequo et saute le rang suivant", () => {
    const ranked = rankPlayers(
      [
        { id: 1, score: 50 },
        { id: 2, score: 50 },
        { id: 3, score: 30 },
      ],
      false,
    );

    expect(ranked.map((p) => p.rank)).toEqual([1, 1, 3]);
    expect(ranked.map((p) => p.isWinner)).toEqual([true, true, false]);
  });

  it("renvoie un tableau vide pour aucun joueur", () => {
    expect(rankPlayers([], false)).toEqual([]);
  });

  it("ne modifie pas le tableau d'entrée", () => {
    const players = [
      { id: 1, score: 10 },
      { id: 2, score: 20 },
    ];
    rankPlayers(players, false);
    expect(players).toEqual([
      { id: 1, score: 10 },
      { id: 2, score: 20 },
    ]);
  });
});
