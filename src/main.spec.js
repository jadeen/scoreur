import { beforeEach, describe, expect, it } from "vitest";

describe("main", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it("monte l'application sur #app", async () => {
    await import("./main.js");

    expect(document.querySelector("#app .logo")?.textContent).toBe("Scoreur");
  });
});
