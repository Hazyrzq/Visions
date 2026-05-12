export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-[var(--vs-line-soft)] rounded-lg ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="vs-card p-5">
      <Skeleton className="h-9 w-9 rounded-xl mb-3" />
      <Skeleton className="h-7 w-24 mb-1" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
