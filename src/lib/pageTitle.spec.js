import { describe, expect, it } from "vitest";
import { setPageTitle } from "./pageTitle";

describe("setPageTitle", () => {
  it("ajoute le nom du site au titre de la page", () => {
    setPageTitle("Wizard");

    expect(document.title).toBe("Wizard · Scoreur");
  });
});
