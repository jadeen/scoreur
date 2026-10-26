import { beforeEach, describe, expect, it } from "vitest";

describe("main", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    window.location.hash = "#/";
  });

  it("monte l'application sur #app et affiche l'accueil via le routeur", async () => {
    await import("./main.js");
    const { router } = await import("./router.js");
    await router.isReady();

    expect(document.querySelector("#app .logo img")?.getAttribute("alt")).toBe("Scoreur");
    expect(document.querySelector("#app h1.h1")?.textContent).toBe(
      "Le carnet de scores de vos soirées jeux",
    );
  });
});
