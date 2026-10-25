import { describe, expect, it } from "vitest";
import { formatDateLong, formatDateShort } from "./formatDate";

describe("formatDateShort", () => {
  it("affiche le jour et le mois abrégé, sans l'année", () => {
    expect(formatDateShort("2026-10-17T12:00:00Z")).toBe("17 oct.");
  });
});

describe("formatDateLong", () => {
  it("affiche le jour de la semaine en capitale, le quantième et le mois en entier", () => {
    expect(formatDateLong("2026-10-23T12:00:00Z")).toBe("Vendredi 23 octobre");
  });
});
