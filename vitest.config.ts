import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Tests are pure logic: no DOM, no network, no database.
    environment: "node",
    include: ["src/lib/**/*.test.ts"],
  },
});
