import { HeaderLabel } from "@/components/HeaderLabel"
import { cn } from "@/lib/utils"

/**
 * label · bar · value. The label defines itself when it is a glossary term
 * (tier names, query types); the value is always printed, so the bar is a
 * secondary encoding rather than the only way to read the row.
 */
export function MetricBar({
  label,
  value,
  color,
  labelWidth = "w-20",
}: {
  label: string
  value: number | null
  color: string
  labelWidth?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <HeaderLabel
        term={label}
        className={cn(
          "shrink-0 truncate text-[11px] text-muted-foreground",
          labelWidth
        )}
      >
        {label}
      </HeaderLabel>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.max(0, Math.min(1, value ?? 0)) * 100}%`,
            background: color,
          }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
        {value == null ? "-" : `${Math.round(value * 100)}%`}
      </span>
    </div>
  )
}
