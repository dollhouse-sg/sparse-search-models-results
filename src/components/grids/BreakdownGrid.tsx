import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataGrid, HeatCell } from "@/components/grids/DataGrid"
import { HeatLegend } from "@/components/grids/HeatLegend"
import { DirectionLabel } from "@/components/DirectionLabel"
import { results, shortLabel } from "@/lib/data"
import { modelColor } from "@/lib/viz"
import type { Condition } from "@/types"

/**
 * Models against one dimension, every condition in a single grid.
 *
 * Conditions band the top and the dimension's groups sit beneath, so a card
 * with three groups is one table twelve columns wide rather than four stacked
 * tables three columns wide. One row per model means a model's whole profile
 * reads left to right instead of down through four separate tables.
 */
export function BreakdownGrid({
  title,
  conditions,
  groups,
  cell,
  labelWidth = "9rem",
  minWidth,
}: {
  title: string
  conditions: Condition[]
  /** The dimension's groups, identical across conditions. */
  groups: { key: string; label: string }[]
  cell: (cond: Condition, modelKey: string, groupKey: string) => number | null
  labelWidth?: string
  minWidth?: string
}) {
  const models = results.models.filter((m) => !m.error)
  const rows = models.map((m) => ({
    key: m.key,
    label: shortLabel(m.key, m.label),
    color: modelColor(m.key),
  }))

  const columns = conditions.flatMap((cond) =>
    groups.map((g, i) => ({
      key: `${cond.key}::${g.key}`,
      label: g.label,
      bandStart: i === 0,
    }))
  )

  const bands = conditions.map((cond) => ({
    key: cond.key,
    node: <DirectionLabel cond={cond} className="text-sm font-semibold" />,
    span: groups.length,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <DataGrid
          caption={title}
          rows={rows}
          columns={columns}
          groups={bands}
          labelWidth={labelWidth}
          minWidth={minWidth}
          dense
          renderCell={(modelKey, columnKey) => {
            const [condKey, groupKey] = columnKey.split("::")
            const cond = conditions.find((c) => c.key === condKey)!
            return <HeatCell dense value={cell(cond, modelKey, groupKey)} />
          }}
        />
        <HeatLegend />
      </CardContent>
    </Card>
  )
}
