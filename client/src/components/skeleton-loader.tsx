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

export function LoadingOverlay({ message = "Loading...", type = "pulse" }: { message?: string; type?: "spinner" | "morphing" | "pulse" | "orbit" | "wave" }) {
  const getLoader = () => {
    switch (type) {
      case "morphing":
        return <div className="loading-morphing" />;
      case "pulse":
        return <div className="loading-pulse-glow" />;
      case "orbit":
        return <div className="loading-orbit" />;
      case "wave":
        return (
          <div className="loading-wave">
            <div className="wave-dot" />
            <div className="wave-dot" />
            <div className="wave-dot" />
            <div className="wave-dot" />
            <div className="wave-dot" />
          </div>
        );
      case "spinner":
      default:
        return <div className="loading-spinner-lg" />;
    }
  };

  return (
    <div className="table-loading-overlay" data-testid="loading-overlay">
      <div className="flex flex-col items-center gap-3">
        {getLoader()}
        <div className="text-sm font-medium text-white">
          {message}
        </div>
      </div>
    </div>
  );
}

export function InlineLoading({ size = "sm", type = "spinner" }: { size?: "sm" | "lg"; type?: "spinner" | "triple" | "particles" }) {
  if (type === "triple") {
    return (
      <div className="loading-triple-bounce" data-testid="inline-loading">
        <div className="bounce" />
        <div className="bounce" />
        <div className="bounce" />
      </div>
    );
  }
  
  if (type === "particles") {
    return <div className="loading-particles" data-testid="inline-loading" />;
  }
  
  return (
    <div className={`${size === "lg" ? "loading-spinner-lg" : "loading-spinner"}`} data-testid="inline-loading" />
  );
}

export function LoadingDots({ type = "wave" }: { type?: "dots" | "wave" | "triple" }) {
  if (type === "wave") {
    return (
      <div className="loading-wave" data-testid="loading-dots">
        <div className="wave-dot" />
        <div className="wave-dot" />
        <div className="wave-dot" />
        <div className="wave-dot" />
        <div className="wave-dot" />
      </div>
    );
  }
  
  if (type === "triple") {
    return (
      <div className="loading-triple-bounce" data-testid="loading-dots">
        <div className="bounce" />
        <div className="bounce" />
        <div className="bounce" />
      </div>
    );
  }
  
  return (
    <span className="loading-dots" data-testid="loading-dots">
      Loading
    </span>
  );
}

// Awesome loading showcase component
export function AwesomeLoadingShowcase() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-8 bg-card/50 rounded-lg border border-border">
      <div className="flex flex-col items-center gap-3">
        <div className="loading-morphing" />
        <span className="text-xs text-muted-foreground">Morphing</span>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <div className="loading-pulse-glow" />
        <span className="text-xs text-muted-foreground">Pulse Glow</span>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <div className="loading-orbit" />
        <span className="text-xs text-muted-foreground">Orbit</span>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <div className="loading-wave">
          <div className="wave-dot" />
          <div className="wave-dot" />
          <div className="wave-dot" />
          <div className="wave-dot" />
          <div className="wave-dot" />
        </div>
        <span className="text-xs text-muted-foreground">Wave</span>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <div className="loading-particles" />
        <span className="text-xs text-muted-foreground">Particles</span>
      </div>
      
      <div className="flex flex-col items-center gap-3">
        <div className="loading-triple-bounce">
          <div className="bounce" />
          <div className="bounce" />
          <div className="bounce" />
        </div>
        <span className="text-xs text-muted-foreground">Triple Bounce</span>
      </div>
    </div>
  );
}

// Advanced loading component with random animation selection
export function AdvancedLoading({ message = "Loading...", randomize = false }: { message?: string; randomize?: boolean }) {
  const animations = ["morphing", "pulse", "orbit", "wave"] as const;
  const selectedAnimation = randomize 
    ? animations[Math.floor(Math.random() * animations.length)]
    : "pulse";
    
  return <LoadingOverlay message={message} type={selectedAnimation} />;
}