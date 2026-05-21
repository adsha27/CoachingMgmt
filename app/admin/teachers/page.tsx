import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import TeachersClient from "./TeachersClient";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");
  return <TeachersClient />;
}
