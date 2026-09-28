import { defineConfig } from "vitest/config";
import { config } from "dotenv";
import { fileURLToPath } from "node:url"; // new

config({ path: ".env.local" });

export default defineConfig({
  // new: match the "@/..." shortcut defined in tsconfig.json,
  // so tests can import app code that uses it
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 20000,
  },
});
