export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-gray-100 border-t-orange-500 animate-spin" />
        <p className="text-xs text-gray-400 font-medium">Loading…</p>
      </div>
    </div>
  );
}
