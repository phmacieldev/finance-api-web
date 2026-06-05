interface TableSkeletonProps {
  rows?: number
  cols?: number
}

export function TableSkeleton({ rows = 5, cols = 4 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse divide-y divide-gray-100 dark:divide-slate-700">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 rounded-md bg-gray-200 dark:bg-slate-700"
              style={{ flex: j === 0 ? '0 0 72px' : j === cols - 1 ? '0 0 88px' : '1' }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
