import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataGrid, ValueCell } from "@/components/grids/DataGrid"
import { useVisibleModels } from "@/components/model-filter"
import { shortLabel } from "@/lib/data"
import { costRange, fmtMetric } from "@/lib/views"
import { modelColor } from "@/lib/viz"
import type { Condition } from "@/types"

/**
 * Cost per model, one row each, one number per cell.
 *
 * Banding by condition the way the accuracy grids do would give seven metrics
 * times four conditions, too wide to read. Each cell is the median across the
 * page's conditions; the per-condition figures are in the metrics table and the
 * model dialog.
 */
export function CostGrid({ conditions }: { conditions: Condition[] }) {
  const models = useVisibleModels()
  const rows = models.map((m) => ({
    key: m.key,
    label: shortLabel(m.key, m.label),
    color: modelColor(m.key),
  }))

  const columns = [
    { key: "ms", label: "ms/q" },
    { key: "p95", label: "p95" },
    { key: "docnnz", label: "doc nnz" },
    { key: "qnnz", label: "q nnz" },
    { key: "exp", label: "exp" },
    { key: "index", label: "index" },
    { key: "docss", label: "docs/s" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Cost</CardTitle>
      </CardHeader>
      <CardContent>
        <DataGrid
          caption="Cost per model"
          rows={rows}
          columns={columns}
          labelWidth="11rem"
          minWidth="42rem"
          renderCell={(modelKey, colKey) => {
            const c = costRange(conditions, modelKey)
            switch (colKey) {
              case "ms":
                return <ValueCell>{msFmt(c.queryMsMedian)}</ValueCell>
              case "p95":
                return <ValueCell muted>{msFmt(c.queryP95Median)}</ValueCell>
              case "docnnz":
                return <ValueCell>{c.docNnzMedian.toFixed(0)}</ValueCell>
              case "qnnz":
                return (
                  <ValueCell muted>{c.queryNnzMedian.toFixed(1)}</ValueCell>
                )
              case "exp":
                return (
                  <ValueCell
                    muted
                  >{`${c.expansionMedian.toFixed(2)}×`}</ValueCell>
                )
              case "index":
                return (
                  <ValueCell muted>
                    {fmtMetric("seconds", c.indexSMedian)}
                  </ValueCell>
                )
              default:
                return (
                  <ValueCell muted>{c.docsPerSMedian.toFixed(0)}</ValueCell>
                )
            }
          }}
        />
      </CardContent>
    </Card>
  )
}

const msFmt = (v: number) =>
  v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : Math.round(v).toString()
