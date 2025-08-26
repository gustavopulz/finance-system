export default function SkeletonCard({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl shadow-md p-6 sm:p-8 border border-slate-200 dark:border-slate-800 ${className}`}
    >
      <div className="h-6 w-1/3 bg-slate-300 dark:bg-slate-700 rounded mb-4" />
      <div className="h-4 w-2/3 bg-slate-300 dark:bg-slate-700 rounded mb-2" />
      <div className="h-4 w-1/2 bg-slate-300 dark:bg-slate-700 rounded mb-2" />
      <div className="h-4 w-full bg-slate-300 dark:bg-slate-700 rounded mb-2" />
      <div className="h-4 w-3/4 bg-slate-300 dark:bg-slate-700 rounded" />
    </div>
  );
}
