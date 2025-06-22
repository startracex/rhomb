import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: "webdriverio",
      instances: [{ browser: "chrome" }],
      headless: true,
    },
  },
});
