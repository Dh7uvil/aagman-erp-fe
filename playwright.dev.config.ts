import { defineConfig, devices } from "@playwright/test";

/** Run against an already-running dev server (e.g. port 3000). */
export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
  },
  projects: [
    {
      name: "iphone-14-pro",
      use: { ...devices["iPhone 14 Pro"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
