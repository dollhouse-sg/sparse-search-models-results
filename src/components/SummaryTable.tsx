import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HeaderLabel } from "@/components/HeaderLabel"
import { DirectionLabel } from "@/components/DirectionLabel"
import { HeatLegend } from "@/components/grids/HeatLegend"
import { useVisibleModels } from "@/components/model-filter"
import { summaryRows } from "@/lib/views"
import { heatStyle, modelColor } from "@/lib/viz"
import type { Condition } from "@/types"

/**
 * Top-of-page comparison: one row per model, in the same order as every grid
 * below it, with the pooled hit@5 standing in the leading column.
 *
 * The best value in each column keeps full-strength ink; everything else is
 * dulled. "Best" is not always the maximum: latency, model size and index
 * footprint are costs, so their winner is the minimum. Ties all win.
 */
export function SummaryTable({ conditions }: { conditions: Condition[] }) {
  const models = useVisibleModels()
  const rows = summaryRows(conditions, models)

  // Column extremes, with the direction each metric is good in.
  const bestOf = (
    pick: (r: (typeof rows)[number]) => number,
    lowerWins = false
  ) => {
    const vs = rows.map(pick).filter((v) => Number.isFinite(v))
    if (vs.length === 0) return null
    return lowerWins ? Math.min(...vs) : Math.max(...vs)
  }
  const best = {
    hit5: bestOf((r) => r.hit5),
    hit1: bestOf((r) => r.hit1),
    hit10: bestOf((r) => r.hit10),
    mrr: bestOf((r) => r.mrr),
    ms: bestOf((r) => r.cost.queryMsMedian, true),
    size: bestOf((r) => r.meta.params_m ?? Infinity, true),
    nnz: bestOf((r) => r.cost.docNnzMedian, true),
    perCondition: conditions.map((c) =>
      Math.max(
        ...rows.map(
          (r) => r.perCondition.find((p) => p.key === c.key)?.value ?? 0
        )
      )
    ),
  }
  const eq = (a: number | null | undefined, b: number | null) =>
    a != null && b != null && Math.abs(a - b) < 1e-9

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Comparison</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="overflow-x-auto">
          <table
            className="w-full table-fixed border-separate border-spacing-0"
            style={{ minWidth: "52rem" }}
          >
            <caption className="sr-only">Model comparison</caption>
            <colgroup>
              <col style={{ width: "1.75rem" }} />
              <col style={{ width: "10rem" }} />
              <col style={{ width: "6.5rem" }} />
              <col style={{ width: "3rem" }} />
              <col style={{ width: "3.25rem" }} />
              <col style={{ width: "3.5rem" }} />
              {conditions.map((c) => (
                <col key={c.key} style={{ width: "4.25rem" }} />
              ))}
              <col style={{ width: "4.5rem" }} />
              <col style={{ width: "3.75rem" }} />
              <col style={{ width: "4rem" }} />
            </colgroup>

            <thead>
              <tr className="text-xs font-semibold">
                <th className="pb-1.5" />
                <th className="pb-1.5 pl-1 text-left">Model</th>
                <th className="pb-1.5 text-left">
                  <HeaderLabel term="hit@5">hit@5</HeaderLabel>
                </th>
                <Th term="@1">@1</Th>
                <Th term="@10">@10</Th>
                <Th term="mrr">MRR</Th>
                {conditions.map((c) => (
                  <th key={c.key} className="px-0.5 pb-1.5 text-center">
                    <DirectionLabel cond={c} className="text-xs" />
                  </th>
                ))}
                <Th term="ms/q">ms/q</Th>
                <Th term="size">size</Th>
                <Th term="doc nnz">nnz</Th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.meta.key}
                  className="border-b last:border-0 hover:bg-muted/40"
                >
                  <td className="py-1.5 text-center text-[11px] text-muted-foreground tabular-nums">
                    {r.rank}
                  </td>
                  <td className="py-1.5 pl-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ background: modelColor(r.meta.key) }}
                      />
                      <span className="truncate text-xs font-medium">
                        {r.meta.label}
                      </span>
                    </div>
                  </td>

                  <td className="py-1.5 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${r.hit5 * 100}%`,
                            background: modelColor(r.meta.key),
                          }}
                        />
                      </div>
                      <span
                        className={
                          "w-8 shrink-0 text-right text-xs tabular-nums " +
                          (eq(r.hit5, best.hit5)
                            ? "font-semibold text-foreground"
                            : "font-normal text-muted-foreground/55")
                        }
                      >
                        {pct(r.hit5)}
                      </span>
                    </div>
                  </td>

                  <Td best={eq(r.hit1, best.hit1)}>{pct(r.hit1)}</Td>
                  <Td best={eq(r.hit10, best.hit10)}>{pct(r.hit10)}</Td>
                  <Td best={eq(r.mrr, best.mrr)}>{r.mrr.toFixed(3)}</Td>

                  {r.perCondition.map((p, ci) => {
                    const isBest = eq(p.value, best.perCondition[ci])
                    return (
                      <td key={p.key} className="px-0.5 py-1">
                        <div
                          className={
                            "flex h-7 items-center justify-center rounded-md text-[11px] tabular-nums " +
                            (isBest
                              ? "font-semibold"
                              : "font-normal opacity-45")
                          }
                          style={heatStyle(p.value)}
                        >
                          {pct(p.value)}
                        </div>
                      </td>
                    )
                  })}

                  <Td best={eq(r.cost.queryMsMedian, best.ms)}>
                    {ms(r.cost.queryMsMedian)}
                  </Td>
                  <Td muted best={eq(r.meta.params_m ?? Infinity, best.size)}>
                    {r.meta.params_m ? `${r.meta.params_m}M` : "-"}
                  </Td>
                  <Td muted best={eq(r.cost.docNnzMedian, best.nnz)}>
                    {r.cost.docNnzMedian.toFixed(0)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <HeatLegend />
      </CardContent>
    </Card>
  )
}

function Th({ children, term }: { children: React.ReactNode; term?: string }) {
  return (
    <th className="px-1 pb-1.5 text-center whitespace-nowrap">
      <HeaderLabel term={term}>{children}</HeaderLabel>
    </th>
  )
}

function Td({
  children,
  best,
}: {
  children: React.ReactNode
  muted?: boolean
  best?: boolean
}) {
  return (
    <td
      className={
        "px-1 py-1.5 text-center text-[11px] tabular-nums " +
        (best
          ? "font-semibold text-foreground"
          : "font-normal text-muted-foreground/55")
      }
    >
      {children}
    </td>
  )
}

const pct = (v: number) => `${Math.round(v * 100)}%`
const ms = (v: number) =>
  v < 1 ? v.toFixed(2) : v < 10 ? v.toFixed(1) : Math.round(v).toString()
