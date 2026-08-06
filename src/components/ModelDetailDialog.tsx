import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RankStrip } from "@/components/RankStrip"
import { MetricBar } from "@/components/MetricBar"
import { fmtS, shortLabel } from "@/lib/data"
import {
  byDimension,
  fmtMetric,
  METRIC_FIELDS,
  metricValue,
  TIER_ORDER_TYPED,
} from "@/lib/views"
import { DirectionLabel } from "@/components/DirectionLabel"
import { HeaderLabel } from "@/components/HeaderLabel"
import { modelColor, TIER_COLOR } from "@/lib/viz"
import type { Condition, ModelMeta } from "@/types"

/**
 * Every published number for one model, so nothing in the file is more than two
 * clicks away: the full 14-metric grid across the view's four conditions, plus
 * the derived section and vendor cuts that the metrics block does not carry.
 */
export function ModelDetailDialog({
  meta,
  conditions,
  open,
  onOpenChange,
}: {
  meta: ModelMeta | null
  conditions: Condition[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const conds = meta ? conditions : []
  const color = meta ? modelColor(meta.key) : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ background: color }}
            />
            {meta && shortLabel(meta.key, meta.label)}
          </DialogTitle>
          <DialogDescription>{meta?.notes}</DialogDescription>
        </DialogHeader>

        {meta && (
          <div className="flex max-h-[72vh] flex-col gap-5 overflow-y-auto pr-1">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="capitalize">
                {meta.family}
              </Badge>
              {meta.multilingual && (
                <Badge variant="outline">multilingual</Badge>
              )}
              {meta.inference_free_query && (
                <Badge variant="outline">inference-free query</Badge>
              )}
              <Badge variant="secondary" className="font-mono">
                {meta.params_m ? `${meta.params_m}M params` : "no weights"}
              </Badge>
              <Badge variant="secondary" className="font-mono">
                load {fmtS(meta.load_s)}
              </Badge>
            </div>

            <Section title="Metrics">
              <div className="overflow-x-auto">
                <Table className="table-fixed" style={{ minWidth: "34rem" }}>
                  <colgroup>
                    <col style={{ width: "8rem" }} />
                    {conds.map((c) => (
                      <col key={c.key} />
                    ))}
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      {conds.map((c) => (
                        <TableHead
                          key={c.key}
                          className="text-right whitespace-nowrap"
                        >
                          <DirectionLabel cond={c} />
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {METRIC_FIELDS.map((f) => (
                      <TableRow key={f.key}>
                        <TableCell className="font-medium whitespace-nowrap">
                          <HeaderLabel term={f.label}>{f.label}</HeaderLabel>
                        </TableCell>
                        {conds.map((c) => (
                          <TableCell
                            key={c.key}
                            className="text-right tabular-nums"
                          >
                            {fmtMetric(
                              f.kind,
                              metricValue(c.metrics[meta.key], f.key)
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Section>

            <Section title="Rank">
              <div className="flex flex-col gap-2">
                {conds.map((c) => (
                  <div key={c.key} className="flex items-center gap-3">
                    <span className="w-16 shrink-0">
                      <DirectionLabel cond={c} className="text-[11px]" />
                    </span>
                    <RankStrip conditionKey={c.key} modelKey={meta.key} />
                  </div>
                ))}
              </div>
            </Section>

            <div className="grid gap-5 md:grid-cols-2">
              <Section title="Section">
                <ConditionGroups
                  conds={conds}
                  modelKey={meta.key}
                  dim="bucket"
                  color={color}
                />
              </Section>
              <Section title="Vendor">
                <ConditionGroups
                  conds={conds}
                  modelKey={meta.key}
                  dim="vendor"
                  color={color}
                />
              </Section>
            </div>

            <Section title="Tier">
              <div className="grid gap-4 sm:grid-cols-2">
                {conds.map((c) => (
                  <div key={c.key} className="flex flex-col gap-1.5">
                    <DirectionLabel cond={c} className="text-[11px]" />
                    {TIER_ORDER_TYPED.map((t) => (
                      <MetricBar
                        key={t}
                        label={t}
                        value={c.metrics[meta.key].by_tier[t]}
                        color={TIER_COLOR[t]}
                        labelWidth="w-14"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ConditionGroups({
  conds,
  modelKey,
  dim,
  color,
}: {
  conds: Condition[]
  modelKey: string
  dim: "bucket" | "vendor"
  color: string
}) {
  return (
    <div className="flex flex-col gap-3">
      {conds.map((c) => (
        <div key={c.key} className="flex flex-col gap-1">
          <DirectionLabel cond={c} className="text-[11px]" />
          {byDimension(c.key, modelKey, dim).map((g) => (
            <MetricBar
              key={g.group}
              label={g.group}
              value={g.rate}
              color={color}
              labelWidth="w-24"
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  )
}
