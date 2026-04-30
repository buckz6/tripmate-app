export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-black/20">
      <div className="mb-5 h-48 rounded-[1.75rem] bg-slate-800" />
      <div className="space-y-3">
        <div className="h-5 w-3/4 rounded-full bg-slate-800" />
        <div className="h-4 w-1/2 rounded-full bg-slate-800" />
        <div className="h-4 w-2/3 rounded-full bg-slate-800" />
        <div className="flex items-center justify-between gap-3 pt-4">
          <div className="h-4 w-1/3 rounded-full bg-slate-800" />
          <div className="h-4 w-1/4 rounded-full bg-slate-800" />
        </div>
      </div>
    </div>
  );
}
