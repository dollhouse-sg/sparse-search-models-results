import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Categorical quality scale for a 1..N rank, not a shadcn semantic token —
// this is a heat-scale over an arbitrary numeric value, same family as a
// status pill but with five buckets instead of two.
function bucket(rank: number | null) {
  if (rank == null) return "miss"
  if (rank === 1) return "top"
  if (rank <= 3) return "good"
  if (rank <= 5) return "ok"
  if (rank <= 10) return "weak"
  return "miss"
}

const STYLES: Record<string, string> = {
  top: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  good: "bg-teal-500/15 text-teal-700 dark:text-teal-400 border-teal-500/30",
  ok: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  weak: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  miss: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
}

export function RankChip({ rank }: { rank: number | null }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "min-w-9 justify-center font-mono tabular-nums",
        STYLES[bucket(rank)]
      )}
    >
      {rank == null ? "miss" : `#${rank}`}
    </Badge>
  )
}
