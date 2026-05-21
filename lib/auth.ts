import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_TTL_DAYS = 14;
export const SESSION_COOKIE = "sid";

export async function createSession(userId: number): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  const row = await prisma.userSession.create({ data: { userId, expiresAt } });
  return row.sessionId;
}

export async function getSession(sessionId: string) {
  const row = await prisma.userSession.findUnique({
    where: { sessionId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true, status: true } },
    },
  });
  if (!row) return null;
  if (row.expiresAt < new Date()) {
    await prisma.userSession.delete({ where: { sessionId } }).catch(() => {});
    return null;
  }
  if (row.user.status !== "ACTIVE") return null;
  return row.user;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.userSession.deleteMany({ where: { sessionId } });
}

// For use in Server Components and Route Handlers (not middleware).
export async function getCurrentUser() {
  const store = await cookies();
  const sid = store.get(SESSION_COOKIE)?.value;
  if (!sid) return null;
  return getSession(sid);
}

export function dashboardFor(role: string): string {
  if (role === "TEACHER") return "/teacher/dashboard";
  if (role === "STUDENT") return "/student/dashboard";
  return "/admin";
}
