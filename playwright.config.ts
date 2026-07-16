import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load .env.local so the Playwright process itself has DATABASE_URL.
// (webServer.env only reaches the Next.js child process, not the test runner)
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env", override: false });

// Locally, point the test runner at the test DB, not the dev DB.
// In CI, DATABASE_URL is already the test DB so this is a no-op.
if (process.env.DATABASE_TEST_URL) {
  process.env.DATABASE_URL = process.env.DATABASE_TEST_URL;
}

const DB_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:54329/coaching_mgmt_test?schema=public";

// Playwright always gets its own isolated server on port 3099 so a running
// dev server on 3000 never bleeds its DATABASE_URL into e2e tests.
// Do NOT read NEXT_PUBLIC_BASE_URL here — .env.local may set it to :3000.
const E2E_BASE = "http://127.0.0.1:3099";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: E2E_BASE,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3099",
    url: E2E_BASE,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: DB_URL,
      EMAIL_DELIVERY_MODE: process.env.EMAIL_DELIVERY_MODE ?? "console",
      SMTP_PASS: process.env.SMTP_PASS ?? "test-placeholder",
      EMAIL_FROM: process.env.EMAIL_FROM ?? "noreply@example.test",
      NEXT_PUBLIC_BASE_URL: E2E_BASE,
      CRON_SECRET: process.env.CRON_SECRET ?? "test-cron-secret",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
});
