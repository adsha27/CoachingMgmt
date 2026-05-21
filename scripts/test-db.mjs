import { spawnSync } from "node:child_process";

const mode = process.argv[2] ?? "unit";
const defaultUrl = "postgresql://postgres:postgres@localhost:54329/coaching_mgmt_test?schema=public";
const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_TEST_URL ?? process.env.DATABASE_URL ?? defaultUrl,
  EMAIL_DELIVERY_MODE: process.env.EMAIL_DELIVERY_MODE ?? "console",
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_test_placeholder",
  EMAIL_FROM: process.env.EMAIL_FROM ?? "noreply@example.test",
  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL ?? "http://127.0.0.1:3000",
  CRON_SECRET: process.env.CRON_SECRET ?? "test-cron-secret",
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env,
    shell: false,
    ...options,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function tryRun(command, args) {
  return spawnSync(command, args, { stdio: "ignore", env, shell: false }).status === 0;
}

run("docker", ["compose", "up", "-d", "test-db"]);

let migrated = false;
for (let attempt = 1; attempt <= 45; attempt += 1) {
  if (tryRun("npx", ["prisma", "migrate", "deploy"])) {
    migrated = true;
    break;
  }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
}

if (!migrated) {
  console.error("Test database did not become ready for Prisma migrations.");
  process.exit(1);
}

if (mode === "unit") {
  run("npx", ["vitest", "--run"]);
} else if (mode === "e2e") {
  run("npx", ["playwright", "test"]);
} else if (mode === "all") {
  run("npx", ["vitest", "--run"]);
  run("npx", ["playwright", "test"]);
} else {
  console.error(`Unknown test-db mode: ${mode}`);
  process.exit(1);
}
