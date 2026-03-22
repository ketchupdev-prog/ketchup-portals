/**
 * Vitest config for unit and integration tests
 * Location: vitest.config.ts
 */

import { defineConfig } from "vitest/config";
import path from "path";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    testTimeout: 60000, // 60 second timeout for integration tests
    hookTimeout: 60000, // 60 second timeout for setup/teardown
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html", "json"],
      include: ["src/lib/**/*.ts", "src/app/api/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/db/schema.ts",
        "**/__tests__/**",
        "**/test-utils/**",
      ],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
