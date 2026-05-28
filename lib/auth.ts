import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_TTL_DAYS = 30;
export const SESSION_COOKIE = "sid";

export async function createSession(userId: number): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  const row = await prisma.userSession.create({ data: { userId, expiresAt } });
  return row.sessionId;
}

export async function createParentSession(userId: number, parentStudentId: number): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS);
  const row = await prisma.userSession.create({ data: { userId, parentStudentId, expiresAt } });
  return row.sessionId;
}

const USER_SELECT = { id: true, name: true, phone: true, email: true, role: true, status: true } as const;

export async function getSession(sessionId: string) {
  const row = await prisma.userSession.findUnique({
    where: { sessionId },
    include: { user: { select: USER_SELECT } },
  });
  if (!row) return null;
  if (row.expiresAt < new Date()) {
    await prisma.userSession.delete({ where: { sessionId } }).catch(() => {});
    return null;
  }
  if (row.user.status !== "ACTIVE") return null;
  return { ...row.user, parentStudentId: row.parentStudentId ?? null };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await prisma.userSession.deleteMany({ where: { sessionId } });
}

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
