import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { PATCH as patchPackage } from "@/app/api/teacher/packages/[id]/route";
import { PATCH as decideApplication } from "@/app/api/teacher/applications/[id]/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

const P = "__test_pkglink__";
let seq = 0;
const uid = () => `${P}_${Date.now()}_${++seq}`;
const phone = () => `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;

const mkUser = (role: "TEACHER" | "STUDENT") =>
  prisma.user.create({ data: { name: `${P} ${role}`, phone: phone(), email: `${uid()}@test.invalid`, role, status: "ACTIVE" } });

const mkPackage = (teacherId: number) =>
  prisma.oneOnOnePackage.create({
    data: { teacherId, title: `${P} Package`, subject: "Physics", totalSessions: 4,
      sessionDurationMinutes: 60, priceINR: 5000, status: "LISTED" },
  });

const req = (url: string, body: unknown, sid: string) =>
  new NextRequest(`http://localhost${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE}=${sid}` },
    body: JSON.stringify(body),
  });

afterEach(async () => {
  await prisma.session.deleteMany({ where: { booking: { oneOnOnePackage: { teacher: { name: { startsWith: P } } } } } });
  await prisma.booking.deleteMany({ where: { OR: [{ student: { name: { startsWith: P } } }, { oneOnOnePackage: { teacher: { name: { startsWith: P } } } }] } });
  await prisma.oneOnOnePackage.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

describe("1-on-1 package meeting link", () => {
  it("teacher sets a link on the package", async () => {
    const t = await mkUser("TEACHER");
    const pkg = await mkPackage(t.id);
    const sid = await createSession(t.id);

    const res = await patchPackage(
      req(`/api/teacher/packages/${pkg.id}`, { action: "set-meeting-link", meetingLink: "https://zoom.us/j/9876" }, sid),
      { params: Promise.resolve({ id: String(pkg.id) }) },
    );
    expect(res.status).toBe(200);
    const after = await prisma.oneOnOnePackage.findUnique({ where: { id: pkg.id } });
    expect(after!.meetingLink).toBe("https://zoom.us/j/9876");
  });

  it("rejects a malformed link and refuses a non-owner", async () => {
    const owner = await mkUser("TEACHER");
    const other = await mkUser("TEACHER");
    const pkg = await mkPackage(owner.id);

    const bad = await patchPackage(
      req(`/api/teacher/packages/${pkg.id}`, { action: "set-meeting-link", meetingLink: "nope" }, await createSession(owner.id)),
      { params: Promise.resolve({ id: String(pkg.id) }) },
    );
    expect(bad.status).toBe(400);

    const foreign = await patchPackage(
      req(`/api/teacher/packages/${pkg.id}`, { action: "set-meeting-link", meetingLink: "https://zoom.us/j/1" }, await createSession(other.id)),
      { params: Promise.resolve({ id: String(pkg.id) }) },
    );
    expect(foreign.status).toBe(404);
    expect((await prisma.oneOnOnePackage.findUnique({ where: { id: pkg.id } }))!.meetingLink).toBeNull();
  });

  it("approving a 1-on-1 application activates it (link goes out in the email)", async () => {
    const t = await mkUser("TEACHER");
    const s = await mkUser("STUDENT");
    const pkg = await mkPackage(t.id);
    const sid = await createSession(t.id);

    await patchPackage(
      req(`/api/teacher/packages/${pkg.id}`, { action: "set-meeting-link", meetingLink: "https://zoom.us/j/555" }, sid),
      { params: Promise.resolve({ id: String(pkg.id) }) },
    );

    const booking = await prisma.booking.create({
      data: { studentId: s.id, oneOnOnePackageId: pkg.id, status: "PENDING", courseType: "ONE_ON_ONE", totalSessions: 4, sessionsRemaining: 4 },
    });

    const res = await decideApplication(
      req(`/api/teacher/applications/${booking.id}`, { action: "approve" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(200);
    expect((await prisma.booking.findUnique({ where: { id: booking.id } }))!.status).toBe("ACTIVE");
  });
});
