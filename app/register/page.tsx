import Link from "next/link";

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Join the platform</h1>
        <p className="text-sm text-gray-500 mb-8">
          Select your role to get started. An admin will review your application.
        </p>
        <div className="space-y-3">
          <Link
            href="/register/teacher"
            className="block w-full py-3 px-4 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
          >
            Register as a Teacher
          </Link>
          <Link
            href="/register/student"
            className="block w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
          >
            Register as a Student
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-500">
          Already registered?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
