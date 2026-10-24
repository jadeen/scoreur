import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/",
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: true,
    env: {
      // Clé publique (sb_publishable_…), faite pour être exposée côté client — safe à committer.
      VITE_SUPABASE_URL: "https://iwzbxpnnhutdolhkchnu.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_aEUzbFtwNIRMN_sBpmE_JQ_2uSyii2y",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{js,vue}"],
      exclude: ["src/**/*.spec.js"],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
});
