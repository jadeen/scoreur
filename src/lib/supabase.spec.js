import { describe, expect, it } from "vitest";
import { supabase } from "./supabase";

describe("supabase", () => {
  it("crée un client Supabase prêt à requêter", () => {
    expect(typeof supabase.from).toBe("function");
  });
});
