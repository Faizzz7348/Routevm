interface SkeletonLoaderProps {
  rows?: number;
  columns?: number;
  className?: string;
}

interface SkeletonRowProps {
  columns?: number;
  index?: number;
}

interface SkeletonCellProps {
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonCell({ width = "w-full", height = "h-4", className = "" }: SkeletonCellProps) {
  return (
    <div className={`skeleton ${width} ${height} ${className}`} data-testid="skeleton-cell" />
  );
}

export function SkeletonRow({ columns = 7, index = 0 }: SkeletonRowProps) {
  return (
    <tr className={`skeleton-row fade-in-stagger border-b border-border/20`} data-testid={`skeleton-row-${index}`}>
      {/* Actions column */}
      <td className="p-3 w-16">
        <div className="flex gap-1 justify-center">
          <SkeletonCell width="w-8" height="h-8" className="rounded-md" />
          <SkeletonCell width="w-8" height="h-8" className="rounded-md" />
          <SkeletonCell width="w-8" height="h-8" className="rounded-md" />
          <SkeletonCell width="w-8" height="h-8" className="rounded-md" />
        </div>
      </td>

      {/* No column */}
      <td className="p-3 w-16">
        <SkeletonCell width="w-8" height="h-4" className="mx-auto" />
      </td>

      {/* Dynamic columns */}
      {Array.from({ length: columns - 2 }).map((_, colIndex) => (
        <td key={colIndex} className="p-3">
          {colIndex === 1 ? ( // Location column (spans 3)
            <SkeletonCell width="w-32" height="h-4" />
          ) : colIndex === 2 || colIndex === 3 ? null : ( // Skip for colspan
            <SkeletonCell width={colIndex === 0 ? "w-16" : "w-20"} height="h-4" />
          )}
        </td>
      ))}
    </tr>
  );
}

export function SkeletonLoader({ rows = 5, columns = 7, className = "" }: SkeletonLoaderProps) {
  return (
    <div className={`w-full ${className}`} data-testid="skeleton-loader">
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, index) => (
            <SkeletonRow key={index} columns={columns} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="table-loading-overlay" data-testid="loading-overlay">
      <div className="flex flex-col items-center gap-4">
        <div className="loading-spinner-lg" />
        <div className="text-sm font-medium text-foreground/70 pagination-10px">
          {message}
        </div>
      </div>
    </div>
  );
}

export function InlineLoading({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <div className={`${size === "lg" ? "loading-spinner-lg" : "loading-spinner"}`} data-testid="inline-loading" />
  );
}

export function LoadingDots() {
  return (
    <span className="loading-dots" data-testid="loading-dots">
      Loading
    </span>
  );
}