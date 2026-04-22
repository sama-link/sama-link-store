import { defineConfig } from "vitest/config";
import path from "node:path";

if (!process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.trim()) {
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL = "http://127.0.0.1:9000";
}

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.smoke.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
