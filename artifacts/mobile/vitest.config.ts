import path from "node:path";
import { defineConfig } from "vitest/config";

// Native modules (react-native, expo-notifications) can't load in a plain Node
// test environment, so we alias them to lightweight stubs. The scheduling math
// under test doesn't touch them — they're only imported at module scope.
export default defineConfig({
  resolve: {
    alias: {
      "react-native": path.resolve(__dirname, "test/stubs/react-native.ts"),
      "expo-notifications": path.resolve(
        __dirname,
        "test/stubs/expo-notifications.ts",
      ),
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
  },
});
