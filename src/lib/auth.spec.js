import { describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

const { signInWithGoogle, signOut, userDisplayName } = await import("./auth");
const { supabase } = await import("./supabase");

describe("userDisplayName", () => {
  it("préfère le nom complet Google", () => {
    expect(userDisplayName({ user_metadata: { full_name: "Léa Martin" }, email: "a@a.fr" })).toBe(
      "Léa Martin",
    );
  });

  it("retombe sur l'e-mail sans métadonnées", () => {
    expect(userDisplayName({ user_metadata: {}, email: "lea@example.fr" })).toBe("lea@example.fr");
  });

  it("renvoie une chaîne vide sans utilisateur", () => {
    expect(userDisplayName(null)).toBe("");
  });
});

describe("signInWithGoogle / signOut", () => {
  it("déclenche la connexion Google via Supabase, avec retour vers l'origine courante", () => {
    signInWithGoogle();
    expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  });

  it("déclenche la déconnexion via Supabase", () => {
    signOut();
    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
