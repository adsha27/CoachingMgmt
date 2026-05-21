import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewSessionForm from "./NewSessionForm";

export const dynamic = "force-dynamic";

export default async function NewSessionPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [teachers, students] = await Promise.all([
    prisma.user.findMany({
      where: { role: "TEACHER", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT", status: "ACTIVE" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <NewSessionForm teachers={teachers} students={students} />;
}
