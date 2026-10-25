import { afterEach, describe, expect, it } from "vitest";
import { dismissAlphaBanner, isAlphaBannerDismissed } from "./alphaBanner";

describe("bandeau alpha", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("n'est pas masqué par défaut", () => {
    expect(isAlphaBannerDismissed()).toBe(false);
  });

  it("reste masqué une fois fermé", () => {
    dismissAlphaBanner();

    expect(isAlphaBannerDismissed()).toBe(true);
  });
});
