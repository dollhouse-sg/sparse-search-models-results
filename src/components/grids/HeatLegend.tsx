import { HEAT_LEGEND, heatStyle } from "@/lib/viz"

/** Scale key for every heat-tinted grid on the page. */
export function HeatLegend({ label = "hit@5" }: { label?: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className="text-[11px] text-muted-foreground tabular-nums">0%</span>
      <div className="flex gap-0.5">
        {HEAT_LEGEND.map(({ step, rate }) => (
          <div
            key={step}
            className="size-4 rounded-[3px]"
            style={{ background: heatStyle(rate).background }}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums">
        100%
      </span>
    </div>
  )
}
