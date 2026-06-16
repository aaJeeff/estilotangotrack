export function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs font-medium text-slate-500">
        <span>Progreso del pedido</span>
        <span>{progress}%</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-[width] duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
