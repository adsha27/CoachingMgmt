import * as dotenv from "dotenv";
import { afterAll, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";

dotenv.config({ path: ".env.local" });

beforeAll(async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set — add it to .env.local");
  }
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
