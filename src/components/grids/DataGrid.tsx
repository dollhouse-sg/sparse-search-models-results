import type { ReactNode } from "react"
import { HeaderLabel } from "@/components/HeaderLabel"
import { heatStyle } from "@/lib/viz"
import { cn } from "@/lib/utils"

export interface GridRow {
  key: string
  label: string
  /** Entity colour dot, when the row is a model. */
  color?: string
  /** Tooltip defining this row's label, e.g. what a direction code means. */
  hint?: string
  /** Rendered instead of `label`. */
  node?: ReactNode
}

export interface GridColumn {
  key: string
  label: string
  /** Overrides the glossary lookup for this column's tooltip. */
  hint?: string
  /** Rendered instead of `label`; `label` still drives the tooltip and caption. */
  node?: ReactNode
  /** First column of a header band; draws the divider. */
  bandStart?: boolean
}

/**
 * Equal-width comparison grid. Every data column is the same width regardless of
 * its contents — `table-fixed` plus a `<colgroup>` that pins only the label
 * column, letting the browser divide the remainder evenly. Every grid on the
 * page shares this so figures line up across cards and sections.
 */
export interface GridGroup {
  key: string
  /** Rendered above the columns it spans. */
  node: ReactNode
  span: number
}

export function DataGrid({
  rows,
  columns,
  groups,
  renderCell,
  labelWidth = "7rem",
  minWidth,
  caption,
  dense = false,
}: {
  rows: GridRow[]
  columns: GridColumn[]
  /** Optional banding row above the column headers, e.g. one band per condition. */
  groups?: GridGroup[]
  renderCell: (rowKey: string, columnKey: string) => ReactNode
  labelWidth?: string
  minWidth?: string
  caption: string
  dense?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table
        className="w-full table-fixed border-separate border-spacing-0.5"
        style={minWidth ? { minWidth } : undefined}
      >
        <caption className="sr-only">{caption}</caption>
        <colgroup>
          <col style={{ width: labelWidth }} />
          {columns.map((c) => (
            <col key={c.key} />
          ))}
        </colgroup>
        <thead>
          {groups && (
            <tr>
              <th />
              {groups.map((g, i) => (
                <th
                  key={g.key}
                  colSpan={g.span}
                  className={cn(
                    "px-0.5 pb-1 text-center",
                    i > 0 && "border-l border-border"
                  )}
                >
                  {g.node}
                </th>
              ))}
            </tr>
          )}
          <tr>
            <th />
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "px-0.5 pb-1.5 text-center font-semibold text-foreground",
                  dense ? "text-[11px]" : "text-xs",
                  c.bandStart && "border-l border-border"
                )}
              >
                <HeaderLabel
                  term={c.label}
                  hint={c.hint}
                  className={cn("block truncate", !c.node && "capitalize")}
                >
                  {c.node ?? c.label}
                </HeaderLabel>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <th
                scope="row"
                className={cn(
                  "truncate pr-2 text-left font-medium whitespace-nowrap",
                  dense ? "text-[10px]" : "text-[11px]"
                )}
              >
                <span className="flex items-center gap-1.5">
                  {r.color && (
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: r.color }}
                    />
                  )}
                  <HeaderLabel hint={r.hint} className="truncate">
                    {r.node ?? r.label}
                  </HeaderLabel>
                </span>
              </th>
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn("p-0", c.bandStart && "border-l border-border")}
                >
                  {renderCell(r.key, c.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * A rate cell: heat-tinted background with the value always printed, so colour
 * is a secondary encoding rather than the only way to read it.
 */
export function HeatCell({
  value,
  dense = false,
}: {
  value: number | null
  dense?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md font-medium tabular-nums",
        dense ? "h-6 text-[10px]" : "h-8 text-[11px]"
      )}
      style={heatStyle(value)}
    >
      {value == null ? "-" : `${Math.round(value * 100)}%`}
    </div>
  )
}

/** A plain numeric cell for cost figures, where a heat tint would imply an order. */
export function ValueCell({
  children,
  dense = false,
  muted = false,
}: {
  children: ReactNode
  dense?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md bg-muted/40 tabular-nums",
        dense ? "h-6 text-[10px]" : "h-8 text-[11px]",
        muted && "text-muted-foreground"
      )}
    >
      {children}
    </div>
  )
}
