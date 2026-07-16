import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { discountPct } from "@/lib/pricing";
import ApplyButton from "@/app/_components/ApplyButton";

export const dynamic = "force-dynamic";

export default async function ApplyPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pkgId = Number(id);
  const user = await getCurrentUser();

  const pkg = await prisma.oneOnOnePackage.findUnique({
    where: { id: pkgId },
    include: { teacher: { select: { id: true, name: true } } },
  });

  if (!pkg || pkg.status === "DRAFT") notFound();

  const existingBooking = user && user.role === "STUDENT"
    ? await prisma.booking.findFirst({
        where: { studentId: user.id, oneOnOnePackageId: pkgId, status: { in: ["PENDING", "ACTIVE"] } },
      })
    : null;

  return (
    <main className="max-w-lg mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/teacher/${pkg.teacher.id}`} className="text-sm text-orange-600 hover:underline">
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
            {(() => {
              const off = discountPct(pkg.originalPriceINR, pkg.priceINR);
              return off !== null ? (
                <p className="text-xs">
                  <span className="text-gray-400 line-through">₹{pkg.originalPriceINR!.toLocaleString("en-IN")}</span>{" "}
                  <span className="font-semibold text-emerald-600">{off}% off</span>
                </p>
              ) : null;
            })()}
          </div>
        </div>

        {existingBooking?.status === "ACTIVE" ? (
          <div className="text-center py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
            ✓ Booked · <Link href="/student/dashboard" className="underline">Go to dashboard</Link>
          </div>
        ) : existingBooking?.status === "PENDING" ? (
          <div className="text-center py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 font-medium">
            ⏳ Application submitted — awaiting your teacher&apos;s approval.
          </div>
        ) : user && user.role === "STUDENT" ? (
          <ApplyButton packageId={pkgId} color="emerald" />
        ) : user ? (
          <div className="text-center py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
            Applying is for student accounts.
          </div>
        ) : (
          <div className="space-y-2">
            <Link href={`/login?applyPackageId=${pkgId}`}
              className="block text-center w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
              Create profile &amp; apply
            </Link>
            <Link href={`/login?next=/packages/${pkgId}/book`}
              className="block text-center w-full py-2.5 text-sm text-gray-500 hover:text-gray-700">
              Already have an account? Sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
