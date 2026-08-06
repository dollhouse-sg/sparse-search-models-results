import { SparklesIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { RankChip } from "@/components/RankChip"
import { chunkById, results, shortLabel } from "@/lib/data"
import { DirectionLabel } from "@/components/DirectionLabel"
import { modelColor, TIER_COLOR } from "@/lib/viz"
import type { Condition, QueryResult } from "@/types"
import { cn } from "@/lib/utils"

export type Row = { cond: Condition; query: QueryResult }

/** One query run, all models side by side: gold chunk, top-5 retrieved, term weights. */
export function QueryDetailDialog({
  row,
  onOpenChange,
}: {
  row: Row | null
  onOpenChange: (open: boolean) => void
}) {
  const models = results.models.filter((m) => !m.error)
  const gold = row ? chunkById(row.query.id) : undefined
  const goldText =
    gold &&
    (row?.cond.doc_lang === "ko" ? (gold.text_ko ?? gold.text) : gold.text)

  return (
    <Dialog open={!!row} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="pr-6 text-base leading-snug">
            {row?.query.query}
          </DialogTitle>
          <DialogDescription
            render={
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {row && (
                  <>
                    <Badge variant="secondary">
                      <DirectionLabel cond={row.cond} withHint={false} />
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 capitalize">
                      <span
                        aria-hidden
                        className="size-2 rounded-full"
                        style={{ background: TIER_COLOR[row.query.tier] }}
                      />
                      {row.query.tier}
                    </Badge>
                    <Badge variant="outline">{row.query.vendor}</Badge>
                    <Badge variant="outline" className="capitalize">
                      {row.query.bucket}
                    </Badge>
                    {row.query.identifiers.map((id) => (
                      <Badge key={id} variant="secondary" className="font-mono">
                        {id}
                      </Badge>
                    ))}
                  </>
                )}
              </div>
            }
          />
        </DialogHeader>

        {row && (
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
            <Card className="gap-2 bg-muted/30 py-3">
              <CardHeader className="px-4">
                <CardTitle className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                  Gold chunk
                  <span className="font-mono">{row.query.id}</span>
                  {gold && <span className="font-normal">{gold.title}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-sm leading-relaxed">{goldText}</p>
              </CardContent>
            </Card>

            <Separator />

            <div className="flex flex-col gap-5">
              {models.map((m) => {
                const r = row.query.per_model[m.key]
                if (!r) return null
                return (
                  <ModelBreakdown
                    key={m.key}
                    modelKey={m.key}
                    label={shortLabel(m.key, m.label)}
                    result={r}
                    queryText={row.query.query}
                  />
                )
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ModelBreakdown({
  modelKey,
  label,
  result,
  queryText,
}: {
  modelKey: string
  label: string
  result: QueryResult["per_model"][string]
  queryText: string
}) {
  const color = modelColor(modelKey)
  const maxScore = Math.max(...result.top5.map((h) => h.score), 1e-9)
  const maxWeight = Math.max(...result.terms.map(([, w]) => w), 1e-9)
  const literal = new Set(
    queryText.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  )

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-2.5 rounded-full"
          style={{ background: color }}
        />
        <span className="text-sm font-medium">{label}</span>
        <RankChip rank={result.rank} />
      </div>

      <div className="grid gap-4 md:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Top 5 retrieved
          </span>
          {result.top5.map((h, i) => (
            <div key={h.id} className="flex items-center gap-2 text-xs">
              <span className="w-4 shrink-0 text-right text-muted-foreground tabular-nums">
                {i + 1}
              </span>
              <span
                className={cn(
                  "w-16 shrink-0 truncate font-mono",
                  h.gold
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {h.id}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(3, (h.score / maxScore) * 100)}%`,
                    background: h.gold
                      ? color
                      : "var(--color-muted-foreground)",
                    opacity: h.gold ? 1 : 0.35,
                  }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-muted-foreground tabular-nums">
                {h.score.toFixed(1)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
            Query terms by weight
            <Tooltip>
              <TooltipTrigger
                render={
                  <SparklesIcon
                    className="size-3"
                    aria-label="expansion legend"
                  />
                }
              />
              <TooltipContent className="max-w-64">
                Filled dot: term the model added, not in the query
              </TooltipContent>
            </Tooltip>
          </span>
          {result.terms.slice(0, 10).map(([term, w]) => {
            const expanded = !literal.has(term.replace(/^##/, "").toLowerCase())
            return (
              <div key={term} className="flex items-center gap-2 text-xs">
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    expanded ? "opacity-100" : "opacity-0"
                  )}
                  style={{ background: color }}
                />
                <span className="w-20 shrink-0 truncate font-mono" title={term}>
                  {term}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(3, (w / maxWeight) * 100)}%`,
                      background: color,
                      opacity: expanded ? 1 : 0.4,
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-muted-foreground tabular-nums">
                  {w.toFixed(2)}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
