import { describe, expect, it } from "vitest";
import { playersCountLabel, winnersSummary } from "./matchSummary";

function makeMatch(matchPlayers) {
  return { match_players: matchPlayers };
}

describe("playersCountLabel", () => {
  it("affiche « solo » pour une partie à un seul joueur", () => {
    expect(playersCountLabel(makeMatch([{ is_winner: true }]))).toBe("solo");
  });

  it("affiche le nombre de joueurs sinon", () => {
    expect(playersCountLabel(makeMatch([{}, {}, {}]))).toBe("3 joueurs");
  });
});

describe("winnersSummary", () => {
  it("affiche le nom et le score du gagnant", () => {
    const match = makeMatch([
      { score: 210, is_winner: true, players: { name: "Léa" } },
      { score: 180, is_winner: false, players: { name: "Moi" } },
    ]);
    expect(winnersSummary(match)).toBe("victoire : Léa (210 pts)");
  });

  it("regroupe les noms des gagnants en cas d'égalité", () => {
    const match = makeMatch([
      { score: 50, is_winner: true, players: { name: "Léa" } },
      { score: 50, is_winner: true, players: { name: "Hugo" } },
    ]);
    expect(winnersSummary(match)).toBe("victoire : Léa, Hugo (50 pts)");
  });
});
