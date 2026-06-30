import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // ponytail: proxy rejects all queries so pages can .catch() gracefully when DB isn't configured yet
    return new Proxy({} as PrismaClient, {
      get(_, model) {
        return new Proxy({}, {
          get(_, method) {
            return () => Promise.reject(new Error(`DATABASE_URL not set (${String(model)}.${String(method)})`));
          },
        });
      },
    });
  }
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
