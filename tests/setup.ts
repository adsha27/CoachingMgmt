import * as dotenv from "dotenv";
import { afterAll, beforeAll } from "vitest";
import type { PrismaClient } from "@prisma/client";

dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env.local", override: false });

process.env.EMAIL_DELIVERY_MODE ??= "console";
process.env.RESEND_API_KEY ??= "re_test_placeholder";
process.env.EMAIL_FROM ??= "noreply@example.test";
process.env.CRON_SECRET ??= "test-cron-secret";

let prisma: PrismaClient;

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set — run npm run test:db or add it to .env.local");
  }
  ({ prisma } = await import("@/lib/prisma"));
  await prisma.$connect();
});

afterAll(async () => {
  await prisma?.$disconnect();
});
