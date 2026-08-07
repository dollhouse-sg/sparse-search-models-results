import { useMemo, useState } from "react"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useVisibleModels } from "@/components/model-filter"
import { shortLabel } from "@/lib/data"
import { fmtMetric, METRIC_FIELDS, metricValue } from "@/lib/views"
import { DirectionLabel } from "@/components/DirectionLabel"
import { HeaderLabel } from "@/components/HeaderLabel"
import { modelColor } from "@/lib/viz"
import { cn } from "@/lib/utils"
import type { Condition } from "@/types"

/**
 * Every published metric cell in the view — one row per model x condition,
 * one column per metric. This is the table-view twin for every chart above it,
 * and the exhaustive readout the charts summarise.
 */
export function MetricsTable({ conditions }: { conditions: Condition[] }) {
  const models = useVisibleModels()
  const [sort, setSort] = useState<{ key: string; asc: boolean }>({
    key: "hit@5",
    asc: false,
  })

  const rows = useMemo(() => {
    const out = conditions.flatMap((c) =>
      models
        .filter((m) => c.metrics[m.key] && !c.metrics[m.key].error)
        .map((m) => ({ cond: c, meta: m, metrics: c.metrics[m.key] }))
    )
    return out.sort((a, b) => {
      const av = metricValue(a.metrics, sort.key)
      const bv = metricValue(b.metrics, sort.key)
      if (av == null) return 1
      if (bv == null) return -1
      return sort.asc ? av - bv : bv - av
    })
  }, [conditions, models, sort])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">All metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="table-fixed" style={{ minWidth: "78rem" }}>
            <colgroup>
              <col style={{ width: "12rem" }} />
              <col style={{ width: "6rem" }} />
              {METRIC_FIELDS.map((f) => (
                <col key={f.key} style={{ width: "4.5rem" }} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Direction</TableHead>
                {METRIC_FIELDS.map((f) => (
                  <TableHead key={f.key} className="p-0 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-end overflow-hidden px-1 font-normal whitespace-nowrap"
                      onClick={() =>
                        setSort((s) =>
                          s.key === f.key
                            ? { key: f.key, asc: !s.asc }
                            : { key: f.key, asc: false }
                        )
                      }
                    >
                      <HeaderLabel term={f.label}>{f.label}</HeaderLabel>
                      {sort.key === f.key &&
                        (sort.asc ? (
                          <ArrowUpIcon data-icon="inline-end" />
                        ) : (
                          <ArrowDownIcon data-icon="inline-end" />
                        ))}
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ cond, meta, metrics }) => (
                <TableRow key={`${cond.key}-${meta.key}`}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2 overflow-hidden">
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: modelColor(meta.key) }}
                      />
                      <span className="truncate">
                        {shortLabel(meta.key, meta.label)}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    <DirectionLabel cond={cond} />
                  </TableCell>
                  {METRIC_FIELDS.map((f) => (
                    <TableCell
                      key={f.key}
                      className={cn(
                        "truncate text-right tabular-nums",
                        f.key === sort.key && "font-medium text-foreground"
                      )}
                    >
                      {fmtMetric(f.kind, metricValue(metrics, f.key))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
