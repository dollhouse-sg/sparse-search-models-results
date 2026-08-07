import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RankStrip } from "@/components/RankStrip"
import { BreakdownGrid } from "@/components/grids/BreakdownGrid"
import { CostGrid } from "@/components/grids/CostGrid"
import { DataGrid, HeatCell } from "@/components/grids/DataGrid"
import { HeatLegend } from "@/components/grids/HeatLegend"
import { MetricsTable } from "@/components/MetricsTable"
import { ModelCard } from "@/components/ModelCard"
import { NoModels } from "@/components/NoModels"
import { SummaryTable } from "@/components/SummaryTable"
import { useVisibleModels } from "@/components/model-filter"
import { results, shortLabel } from "@/lib/data"
import { byDimension, byIdentifier, TIER_ORDER_TYPED } from "@/lib/views"
import { DirectionLabel } from "@/components/DirectionLabel"
import { modelColor } from "@/lib/viz"
import type { Condition } from "@/types"

const K_VALUES = [1, 3, 5, 10] as const

/**
 * The body both analysis pages render. They differ only in the condition list
 * they pass in, which is what makes them read as siblings — and there is no
 * control anywhere below that changes it.
 */
export function BenchmarkPage({ conditions }: { conditions: Condition[] }) {
  const models = useVisibleModels()
  const modelRows = models.map((m) => ({
    key: m.key,
    label: shortLabel(m.key, m.label),
    color: modelColor(m.key),
  }))
  const hitAtKColumns = conditions.flatMap((c) =>
    K_VALUES.map((k, i) => ({
      key: `${c.key}::${k}`,
      label: `@${k}`,
      bandStart: i === 0,
    }))
  )
  const hitAtKBands = conditions.map((c) => ({
    key: c.key,
    node: <DirectionLabel cond={c} className="text-sm font-semibold" />,
    span: K_VALUES.length,
  }))

  // Only the group names are read, so any model gives the same answer.
  const vendors = byDimension(
    conditions[0].key,
    results.models[0].key,
    "vendor"
  )

  if (models.length === 0) return <NoModels />

  return (
    <div className="flex flex-col gap-5">
      <SummaryTable conditions={conditions} />

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">hit@k</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <DataGrid
            caption="hit@k by model and condition"
            rows={modelRows}
            columns={hitAtKColumns}
            groups={hitAtKBands}
            labelWidth="11rem"
            minWidth="56rem"
            dense
            renderCell={(modelKey, columnKey) => {
              const [condKey, k] = columnKey.split("::")
              const m = conditions.find((c) => c.key === condKey)!.metrics[
                modelKey
              ]
              return (
                <HeatCell
                  dense
                  value={m && !m.error ? m[`hit@${k}` as "hit@5"] : null}
                />
              )
            }}
          />
          <HeatLegend label="hit@k" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Rank</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {conditions.map((c) => (
            <div key={c.key} className="flex flex-col gap-1.5">
              <DirectionLabel cond={c} className="text-sm font-semibold" />
              {models.map((m) => (
                <div key={m.key} className="flex items-center gap-2">
                  <span className="flex w-[11rem] shrink-0 items-center gap-1.5 text-[11px]">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: modelColor(m.key) }}
                    />
                    <span className="truncate">
                      {shortLabel(m.key, m.label)}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <RankStrip conditionKey={c.key} modelKey={m.key} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-medium">Models</h3>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {models.map((m) => (
            <ModelCard key={m.key} meta={m} conditions={conditions} />
          ))}
        </div>
      </section>

      <BreakdownGrid
        title="Tier"
        conditions={conditions}
        groups={TIER_ORDER_TYPED.map((t) => ({ key: t, label: t }))}
        minWidth="56rem"
        cell={(cond, modelKey, groupKey) =>
          cond.metrics[modelKey].by_tier[groupKey as "easy"]
        }
      />

      <BreakdownGrid
        title="Identifier"
        conditions={conditions}
        groups={[
          { key: "withIds", label: "Identifier" },
          { key: "proseOnly", label: "No Identifier" },
        ]}
        minWidth="46rem"
        cell={(cond, modelKey, groupKey) => {
          const split = byIdentifier(cond.key, modelKey)
          return groupKey === "withIds"
            ? split.withIds.rate
            : split.proseOnly.rate
        }}
      />

      <BreakdownGrid
        title="Vendor"
        conditions={conditions}
        groups={vendors.map((v) => ({ key: v.group, label: v.group }))}
        minWidth="56rem"
        cell={(cond, modelKey, groupKey) =>
          byDimension(cond.key, modelKey, "vendor").find(
            (x) => x.group === groupKey
          )?.rate ?? null
        }
      />

      <CostGrid conditions={conditions} />

      <MetricsTable conditions={conditions} />
    </div>
  )
}
