import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LogoutButton from "@/app/_components/LogoutButton";
import AppNav from "@/app/_components/AppNav";
import ChangePasswordButton from "./ChangePasswordButton";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows: [string, string][] = [
    ["Name", user.name],
    ["Email", user.email ?? "—"],
    ["Phone", user.phone ?? "—"],
    ["Role", user.role.charAt(0) + user.role.slice(1).toLowerCase()],
  ];

  return (
    <>
      <AppNav role={user.role} current="/account" />
      <main className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Your account</h1>
        <p className="text-sm text-gray-500 mb-8">Your details and sign-in settings.</p>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Details</h2>
          <dl className="space-y-3 text-sm">
            {rows.map(([label, value]) => (
              <div key={label} className="flex gap-4">
                <dt className="text-gray-500 w-24 shrink-0">{label}</dt>
                <dd className="text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Password</h2>
          <p className="text-sm text-gray-500 mb-4">
            Change the password you use to sign in.
          </p>
          {user.email
            ? <ChangePasswordButton email={user.email} />
            : <p className="text-sm text-gray-500">No email on this account, so a reset link can&apos;t be sent. Ask an admin.</p>}
        </section>

        <LogoutButton />
      </main>
    </>
  );
}
