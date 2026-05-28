import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BookPackageForm from "./BookPackageForm";

export const dynamic = "force-dynamic";

export default async function BookPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/packages/${(await params).id}/book`);
  if (user.role !== "STUDENT") redirect("/");

  const { id } = await params;
  const pkgId = Number(id);

  const pkg = await prisma.oneOnOnePackage.findUnique({
    where: { id: pkgId },
    include: {
      teacher: { select: { id: true, name: true } },
    },
  });

  if (!pkg || pkg.status !== "LISTED") notFound();

  const existingBooking = await prisma.booking.findFirst({
    where: { studentId: user.id, oneOnOnePackageId: pkgId, status: "ACTIVE" },
  });

  return (
    <main className="max-w-lg mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/teacher/${pkg.teacher.id}`} className="text-sm text-indigo-600 hover:underline">
          ← Teacher profile
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{pkg.title}</h1>
        <p className="text-sm text-gray-500 mb-4">
          {pkg.subject}{pkg.targetExam ? ` · ${pkg.targetExam}` : ""} · by {pkg.teacher.name} · 1-on-1
        </p>

        {pkg.description && (
          <p className="text-sm text-gray-700 mb-4">{pkg.description}</p>
        )}

        <div className="grid grid-cols-3 gap-3 text-sm mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Sessions</p>
            <p className="font-semibold text-gray-800">{pkg.totalSessions}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Each</p>
            <p className="font-semibold text-gray-800">{pkg.sessionDurationMinutes} min</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Price</p>
            <p className="font-semibold text-gray-800">₹{pkg.priceINR.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {existingBooking ? (
          <div className="text-center py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
            ✓ Already booked · <Link href="/student/dashboard" className="underline">Go to dashboard</Link>
          </div>
        ) : (
          <BookPackageForm packageId={pkgId} durationMinutes={pkg.sessionDurationMinutes} />
        )}
      </div>
    </main>
  );
}
