import { cn } from "@/shared/lib/utils";

export function ProgressBar({
  progress,
  showLabel = true,
  className,
}: {
  progress: number;
  showLabel?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("portal-progress", className)}>
      {showLabel && (
        <div className="portal-progress-label">
          <span>Progreso del pedido</span>
          <span>{progress}%</span>
        </div>
      )}
      <div
        className="portal-progress-track"
        role="progressbar"
        aria-label="Progreso del pedido"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="portal-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
