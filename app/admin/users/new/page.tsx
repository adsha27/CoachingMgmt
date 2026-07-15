import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AddUserClient from "./AddUserClient";

export const dynamic = "force-dynamic";

export default async function AddUserPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  return <AddUserClient />;
}
