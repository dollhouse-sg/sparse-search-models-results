import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { rankHistogram } from "@/lib/views"

/**
 * Where the gold chunk landed, as one stacked bar. Two hit@5 scores that match
 * can still differ here — a model that puts everything at #1 or nowhere reads
 * very differently from one that lands consistently at #4.
 *
 * Segments are separated by a 2px surface gap rather than a border.
 */
export function RankStrip({
  conditionKey,
  modelKey,
  height = "h-2",
}: {
  conditionKey: string
  modelKey: string
  height?: string
}) {
  const hist = rankHistogram(conditionKey, modelKey)
  const total = hist.reduce((n, b) => n + b.n, 0)

  return (
    <div className={`flex w-full gap-0.5 ${height}`}>
      {hist.map((b) =>
        b.n === 0 ? null : (
          <Tooltip key={b.key}>
            <TooltipTrigger
              render={
                <div
                  className="h-full rounded-[2px] first:rounded-l-full last:rounded-r-full"
                  style={{ width: `${b.share * 100}%`, background: b.color }}
                />
              }
            />
            <TooltipContent>
              rank {b.label}: {b.n} of {total} queries
            </TooltipContent>
          </Tooltip>
        )
      )}
    </div>
  )
}
