import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/",
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: true,
    // Valeurs publiques lues depuis .env.test (committé, cf. commentaire du fichier).
    env: loadEnv("test", process.cwd()),
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
