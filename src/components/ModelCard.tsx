import { useState } from "react"
import { MaximizeIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { RankStrip } from "@/components/RankStrip"
import { DataGrid, HeatCell, ValueCell } from "@/components/grids/DataGrid"
import { ModelDetailDialog } from "@/components/ModelDetailDialog"
import { fmtS, shortLabel } from "@/lib/data"
import {
  byDimension,
  byIdentifier,
  directionLabel,
  fmtMetric,
  metricValue,
  rankHistogram,
  TIER_ORDER_TYPED,
} from "@/lib/views"
import { DirectionLabel } from "@/components/DirectionLabel"
import { directionHint } from "@/lib/glossary"
import { modelColor } from "@/lib/viz"
import type { Condition, ModelMeta } from "@/types"

const K_ROW = [1, 3, 5, 10] as const

/**
 * Everything the benchmark measured about one model. Rows are conditions
 * throughout — there is no selected condition, so every block shows all of
 * them and nothing sits behind a control.
 */
export function ModelCard({
  meta,
  conditions,
}: {
  meta: ModelMeta
  conditions: Condition[]
}) {
  const [open, setOpen] = useState(false)
  const color = modelColor(meta.key)

  const condRows = conditions.map((c) => ({
    key: c.key,
    label: directionLabel(c),
    node: <DirectionLabel cond={c} withHint={false} className="text-[10px]" />,
    hint: directionHint(c.query_lang, c.doc_lang, c.n_docs),
  }))

  const sections = byDimension(conditions[0].key, meta.key, "bucket")
  const vendors = byDimension(conditions[0].key, meta.key, "vendor")

  return (
    <>
      <Card className="relative gap-3 overflow-hidden pt-0">
        <span
          aria-hidden
          className="h-1 w-full shrink-0"
          style={{ background: color }}
        />

        <CardHeader className="gap-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-tight font-semibold">
              {shortLabel(meta.key, meta.label)}
            </CardTitle>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`All metrics for ${meta.label}`}
                onClick={() => setOpen(true)}
              >
                <MaximizeIcon />
              </Button>
            </div>
          </div>
          <CardDescription className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="font-mono">
              {meta.params_m ? `${meta.params_m}M` : "no weights"}
            </Badge>
            <Badge variant="secondary" className="font-mono">
              load {fmtS(meta.load_s)}
            </Badge>
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <Block label="hit@5 and rank">
            <div className="flex flex-col gap-1.5">
              {conditions.map((c) => {
                const m = c.metrics[meta.key]
                const hist = rankHistogram(c.key, meta.key)
                const top1 = hist[0]
                return (
                  <div key={c.key} className="flex items-center gap-2">
                    <span className="w-[4.25rem] shrink-0">
                      <DirectionLabel cond={c} className="text-[11px]" />
                    </span>
                    <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${m["hit@5"] * 100}%`,
                          background: color,
                        }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[11px] font-medium tabular-nums">
                      {Math.round(m["hit@5"] * 100)}%
                    </span>
                    <div className="min-w-0 flex-1">
                      <RankStrip
                        conditionKey={c.key}
                        modelKey={meta.key}
                        height="h-1.5"
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                      {Math.round(top1.share * 100)}%@1
                    </span>
                  </div>
                )
              })}
            </div>
          </Block>

          <Block label="recall">
            <DataGrid
              caption={`${meta.label} recall depth by condition`}
              labelWidth="4.25rem"
              dense
              rows={condRows}
              columns={[
                ...K_ROW.map((k) => ({ key: `hit@${k}`, label: `@${k}` })),
                { key: "mrr@10", label: "MRR" },
                { key: "mean_rank", label: "mean" },
                { key: "misses", label: "miss" },
              ]}
              renderCell={(condKey, colKey) => {
                const c = conditions.find((x) => x.key === condKey)!
                const m = c.metrics[meta.key]
                if (colKey.startsWith("hit@")) {
                  return <HeatCell dense value={m[colKey as "hit@5"]} />
                }
                if (colKey === "mrr@10")
                  return <ValueCell dense>{m["mrr@10"].toFixed(3)}</ValueCell>
                if (colKey === "mean_rank")
                  return (
                    <ValueCell dense muted>
                      {m.mean_rank?.toFixed(1) ?? "-"}
                    </ValueCell>
                  )
                return (
                  <ValueCell dense muted>
                    {m.misses}
                  </ValueCell>
                )
              }}
            />
          </Block>

          <Block label="tier">
            <DataGrid
              caption={`${meta.label} hit@5 by tier`}
              labelWidth="4.25rem"
              dense
              rows={condRows}
              columns={TIER_ORDER_TYPED.map((t) => ({ key: t, label: t }))}
              renderCell={(condKey, colKey) => {
                const c = conditions.find((x) => x.key === condKey)!
                return (
                  <HeatCell
                    dense
                    value={c.metrics[meta.key].by_tier[colKey as "easy"]}
                  />
                )
              }}
            />
          </Block>

          <Block label="Identifier">
            <DataGrid
              caption={`${meta.label} hit@5 by query type`}
              labelWidth="4.25rem"
              dense
              rows={condRows}
              columns={[
                { key: "withIds", label: "Identifier" },
                { key: "proseOnly", label: "No Identifier" },
              ]}
              renderCell={(condKey, colKey) => {
                const split = byIdentifier(condKey, meta.key)
                const g = colKey === "withIds" ? split.withIds : split.proseOnly
                return <HeatCell dense value={g.rate} />
              }}
            />
          </Block>

          <Block label="section">
            <DataGrid
              caption={`${meta.label} hit@5 by section`}
              labelWidth="4.25rem"
              dense
              minWidth="26rem"
              rows={condRows}
              columns={sections.map((s) => ({
                key: s.group,
                label: s.group.slice(0, 6),
                hint: s.group,
              }))}
              renderCell={(condKey, colKey) => {
                const g = byDimension(condKey, meta.key, "bucket").find(
                  (x) => x.group === colKey
                )
                return <HeatCell dense value={g?.rate ?? null} />
              }}
            />
          </Block>

          <Block label="vendor">
            <DataGrid
              caption={`${meta.label} hit@5 by vendor`}
              labelWidth="4.25rem"
              dense
              rows={condRows}
              columns={vendors.map((v) => ({ key: v.group, label: v.group }))}
              renderCell={(condKey, colKey) => {
                const g = byDimension(condKey, meta.key, "vendor").find(
                  (x) => x.group === colKey
                )
                return <HeatCell dense value={g?.rate ?? null} />
              }}
            />
          </Block>

          <Block label="cost">
            <DataGrid
              caption={`${meta.label} cost by condition`}
              labelWidth="4.25rem"
              dense
              minWidth="26rem"
              rows={condRows}
              columns={[
                { key: "query_ms_mean", label: "ms/q" },
                { key: "query_ms_p95", label: "p95" },
                { key: "doc_nnz_mean", label: "doc nnz" },
                { key: "query_nnz_mean", label: "q nnz" },
                { key: "expansion_ratio", label: "exp" },
                { key: "index_s", label: "index" },
                { key: "docs_per_s", label: "docs/s" },
              ]}
              renderCell={(condKey, colKey) => {
                const c = conditions.find((x) => x.key === condKey)!
                const m = c.metrics[meta.key]
                const kind =
                  colKey === "query_ms_mean" || colKey === "query_ms_p95"
                    ? "ms"
                    : colKey === "index_s"
                      ? "seconds"
                      : colKey === "expansion_ratio"
                        ? "times"
                        : "fixed1"
                const v = metricValue(m, colKey)
                return (
                  <ValueCell dense muted>
                    {fmtMetric(kind, v)}
                  </ValueCell>
                )
              }}
            />
          </Block>
        </CardContent>
      </Card>

      <ModelDetailDialog
        meta={meta}
        conditions={conditions}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

function Block({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold">{label}</span>
      {children}
    </div>
  )
}
