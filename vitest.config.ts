// ============================================================
// Vitest configuration — how the engine's automated tests run.
//
// Plain English: this file tells the test runner (Vitest) two
// things: (1) our tests live in the `tests/` folder, and (2) the
// `@/...` import shortcut used across the app also works inside
// tests, so a test can `import { solveGame } from '@/lib/engine'`
// exactly the way the app does.
//
// The calculation engine is pure math with no browser or database,
// so tests run in a plain Node environment — fast and deterministic.
// ============================================================

import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // Map "@/..." to the project root, mirroring tsconfig.json `paths`.
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
