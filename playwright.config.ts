import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: process.env.NEXT_PUBLIC_BASE_URL ?? "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:54329/coaching_mgmt_test?schema=public",
      EMAIL_DELIVERY_MODE: process.env.EMAIL_DELIVERY_MODE ?? "console",
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_test_placeholder",
      EMAIL_FROM: process.env.EMAIL_FROM ?? "noreply@example.test",
      NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://127.0.0.1:3000",
      CRON_SECRET: process.env.CRON_SECRET ?? "test-cron-secret",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
