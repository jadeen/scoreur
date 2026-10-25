import { describe, expect, it } from "vitest";
import {
  formatSigned,
  wizardDealerIndex,
  wizardLedgerRows,
  wizardRoundCount,
  wizardScore,
  wizardTotals,
} from "./wizardScoring";

describe("wizardScore", () => {
  it("rapporte 20 + 10 par pli pour une annonce exacte", () => {
    expect(wizardScore(0, 0)).toBe(20);
    expect(wizardScore(2, 2)).toBe(40);
  });

  it("retire 10 par pli d'écart pour une annonce ratée", () => {
    expect(wizardScore(2, 0)).toBe(-20);
    expect(wizardScore(0, 2)).toBe(-20);
  });
});

describe("wizardRoundCount", () => {
  it("vaut 60 divisé par le nombre de joueurs, arrondi au plus bas", () => {
    expect(wizardRoundCount(4)).toBe(15);
    expect(wizardRoundCount(6)).toBe(10);
  });
});

describe("wizardDealerIndex", () => {
  it("tourne à chaque manche en partant du premier joueur", () => {
    expect(wizardDealerIndex(1, 4)).toBe(0);
    expect(wizardDealerIndex(2, 4)).toBe(1);
    expect(wizardDealerIndex(5, 4)).toBe(0);
  });
});

describe("formatSigned", () => {
  it("préfixe par + ou − selon le signe, sans signe pour zéro", () => {
    expect(formatSigned(20)).toBe("+20");
    expect(formatSigned(-20)).toBe("−20");
    expect(formatSigned(0)).toBe("0");
  });
});

describe("wizardTotals", () => {
  it("additionne les points de chaque manche par joueur", () => {
    const rounds = [
      { bids: [0, 1], tricks: [0, 1] },
      { bids: [1, 0], tricks: [1, 0] },
    ];
    expect(wizardTotals(rounds, 2)).toEqual([50, 50]);
  });
});

describe("wizardLedgerRows", () => {
  it("donne le total cumulé et le détail annonce/plis par manche", () => {
    const rounds = [
      { bids: [0, 1], tricks: [0, 0] },
      { bids: [1, 0], tricks: [1, 0] },
    ];
    const rows = wizardLedgerRows(rounds, 2);

    expect(rows).toEqual([
      {
        label: "1",
        cells: [
          { value: 20, detail: "0/0 · +20", negative: false },
          { value: -10, detail: "1/0 · −10", negative: true },
        ],
      },
      {
        label: "2",
        cells: [
          { value: 50, detail: "1/1 · +30", negative: false },
          { value: 10, detail: "0/0 · +20", negative: false },
        ],
      },
    ]);
  });
});
