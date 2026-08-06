import { useMemo, useState } from "react"
import { ListFilterIcon, SearchIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RankChip } from "@/components/RankChip"
import { QueryDetailDialog, type Row } from "@/components/QueryDetailDialog"
import { fmtPct, results, shortLabel } from "@/lib/data"
import { DirectionLabel } from "@/components/DirectionLabel"
import { directionLabel } from "@/lib/views"
import { modelColor, TIER_COLOR } from "@/lib/viz"
import type { Tier } from "@/types"
import { cn } from "@/lib/utils"

const TIERS: Tier[] = ["easy", "medium", "hard"]

/**
 * The raw browser: every query run in the file. Controls live in the column
 * headers they act on, so the table is the whole interface.
 */
export function Queries() {
  const conds = results.conditions
  const models = results.models.filter((m) => !m.error)

  const [direction, setDirection] = useState("all")
  const [tier, setTier] = useState("all")
  const [q, setQ] = useState("")
  const [sortModel, setSortModel] = useState<string | null>(null)
  const [active, setActive] = useState<Row | null>(null)

  const all: Row[] = useMemo(
    () =>
      conds.flatMap((cond) => cond.queries.map((query) => ({ cond, query }))),
    [conds]
  )

  const rows = useMemo(() => {
    const filtered = all.filter(({ cond, query }) => {
      if (direction !== "all" && cond.key !== direction) return false
      if (tier !== "all" && query.tier !== tier) return false
      if (q && !query.query.toLowerCase().includes(q.toLowerCase()))
        return false
      return true
    })
    if (!sortModel) return filtered
    // Worst first — the interesting rows are the ones a model missed.
    return [...filtered].sort((a, b) => {
      const ar = a.query.per_model[sortModel]?.rank ?? Infinity
      const br = b.query.per_model[sortModel]?.rank ?? Infinity
      return br - ar
    })
  }, [all, direction, tier, q, sortModel])

  const hitRate = useMemo(
    () =>
      Object.fromEntries(
        models.map((m) => {
          const hits = rows.filter(({ query }) => {
            const r = query.per_model[m.key]?.rank
            return r != null && r <= 5
          }).length
          return [m.key, rows.length ? hits / rows.length : null]
        })
      ),
    [rows, models]
  )

  const activeCond = conds.find((c) => c.key === direction)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {rows.length} of {all.length} query runs
        </span>
        {(direction !== "all" || tier !== "all" || q || sortModel) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDirection("all")
              setTier("all")
              setQ("")
              setSortModel(null)
            }}
          >
            <XIcon data-icon="inline-start" />
            Reset
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table className="table-fixed" style={{ minWidth: "62rem" }}>
          <colgroup>
            <col style={{ width: "7rem" }} />
            <col style={{ width: "6rem" }} />
            <col />
            {models.map((m) => (
              <col key={m.key} style={{ width: "5.25rem" }} />
            ))}
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="p-1">
                <HeaderMenu
                  label="Direction"
                  active={activeCond ? directionLabel(activeCond) : null}
                  options={[
                    { value: "all", label: "All directions" },
                    ...conds.map((c) => ({
                      value: c.key,
                      label: directionLabel(c),
                    })),
                  ]}
                  onSelect={setDirection}
                />
              </TableHead>
              <TableHead className="p-1">
                <HeaderMenu
                  label="Tier"
                  active={tier === "all" ? null : tier}
                  options={[
                    { value: "all", label: "All tiers" },
                    ...TIERS.map((t) => ({ value: t, label: t })),
                  ]}
                  onSelect={setTier}
                />
              </TableHead>
              <TableHead className="p-1">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    aria-label="Search query text"
                    placeholder="Search queries…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="h-7 border-0 bg-transparent pl-7 text-xs shadow-none focus-visible:bg-background"
                  />
                </div>
              </TableHead>
              {models.map((m) => (
                <TableHead key={m.key} className="p-1 text-center">
                  <button
                    type="button"
                    title={m.label}
                    onClick={() =>
                      setSortModel((s) => (s === m.key ? null : m.key))
                    }
                    className={cn(
                      "inline-flex w-full items-center justify-center gap-1 rounded-md px-1 py-1 text-[11px] whitespace-nowrap transition-colors hover:bg-accent",
                      sortModel === m.key && "bg-accent font-semibold"
                    )}
                  >
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: modelColor(m.key) }}
                    />
                    <span className="truncate">
                      {shortLabel(m.key, m.label)}
                    </span>
                  </button>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3 + models.length}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <SearchIcon />
                      </EmptyMedia>
                      <EmptyTitle>No query runs match</EmptyTitle>
                      <EmptyDescription>
                        Try a shorter search term.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={`${row.cond.key}-${row.query.id}`}
                  className="cursor-pointer"
                  onClick={() => setActive(row)}
                >
                  <TableCell className="text-xs whitespace-nowrap">
                    <DirectionLabel cond={row.cond} withHint={false} />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5 text-xs capitalize">
                      <span
                        aria-hidden
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: TIER_COLOR[row.query.tier] }}
                      />
                      {row.query.tier}
                    </span>
                  </TableCell>
                  <TableCell className="truncate" title={row.query.query}>
                    {row.query.query}
                  </TableCell>
                  {models.map((m) => (
                    <TableCell key={m.key} className="text-center">
                      <RankChip
                        rank={row.query.per_model[m.key]?.rank ?? null}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}

            {rows.length > 0 && (
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableCell
                  colSpan={3}
                  className="text-xs font-medium text-muted-foreground"
                >
                  hit@5 on this slice
                </TableCell>
                {models.map((m) => (
                  <TableCell
                    key={m.key}
                    className="text-center text-xs font-medium tabular-nums"
                  >
                    {fmtPct(hitRate[m.key])}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <QueryDetailDialog
        row={active}
        onOpenChange={(open) => !open && setActive(null)}
      />
    </div>
  )
}

/** Column-header filter: the control sits on the column it acts on. */
function HeaderMenu({
  label,
  active,
  options,
  onSelect,
}: {
  label: string
  active: string | null
  options: { value: string; label: string }[]
  onSelect: (v: string) => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline-flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-[11px] transition-colors hover:bg-accent",
              active && "font-semibold text-foreground"
            )}
          >
            <ListFilterIcon className="size-3 shrink-0 opacity-60" />
            <span className="truncate capitalize">{active ?? label}</span>
          </button>
        }
      />
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          {options.map((o) => (
            <DropdownMenuItem
              key={o.value}
              onClick={() => onSelect(o.value)}
              className="text-xs capitalize"
            >
              {o.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
