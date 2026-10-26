import { afterEach, describe, expect, it } from "vitest";
import { router } from "./router";

describe("router", () => {
  afterEach(async () => {
    await router.push("/");
  });

  it("applique le titre de l'accueil par défaut", async () => {
    await router.push("/jeux");
    await router.push("/");

    expect(document.title).toBe("Scoreur — Le carnet de scores de vos soirées jeux");
  });

  it("applique le titre de chaque route fixe après navigation", async () => {
    await router.push("/jeux");
    expect(document.title).toBe("Jeux · Scoreur");

    await router.push("/joueurs");
    expect(document.title).toBe("Joueurs · Scoreur");

    await router.push("/historique");
    expect(document.title).toBe("Historique · Scoreur");

    await router.push("/compte");
    expect(document.title).toBe("Mon compte · Scoreur");

    await router.push("/mentions-legales");
    expect(document.title).toBe("Mentions légales · Scoreur");

    await router.push("/confidentialite");
    expect(document.title).toBe("Confidentialité · Scoreur");
  });
});
