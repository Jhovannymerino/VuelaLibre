import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.e2e.js",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:43187", headless: true },
  webServer: {
    command: "npm run dev -- --port 43187 --strictPort",
    url: "http://127.0.0.1:43187",
    reuseExistingServer: false,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: "mobile",
      use: {
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
