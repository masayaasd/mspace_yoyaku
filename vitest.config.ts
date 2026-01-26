import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    env: {
      ...process.env,
      ...dotenv.config({ path: ".env.test" }).parsed,
    },
    include: ["src/**/*.test.ts"],
  },
});
