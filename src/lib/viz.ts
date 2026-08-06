import type { Tier } from "@/types"

/**
 * Categorical slot per model *key*. Assigned once, in corpus order, and never
 * recomputed from rank — a reader who learns "SPLADE is aqua" must keep being
 * right after they switch condition or filter the table.
 */
const MODEL_COLOR: Record<string, string> = {
  bm25: "var(--series-1)",
  tfidf: "var(--series-2)",
  splade: "var(--series-3)",
  opensearch_en: "var(--series-4)",
  opensearch_multi: "var(--series-5)",
  bgem3: "var(--series-6)",
}

export function modelColor(key: string) {
  return MODEL_COLOR[key] ?? "var(--color-muted-foreground)"
}

export const TIER_COLOR: Record<Tier, string> = {
  easy: "var(--tier-easy)",
  medium: "var(--tier-medium)",
  hard: "var(--tier-hard)",
}

const HEAT_STEPS = 8

/** Maps a 0..1 rate onto the sequential ramp declared in index.css. */
export function heatStyle(value: number | null | undefined) {
  if (value == null) {
    return {
      background: "var(--color-muted)",
      color: "var(--color-muted-foreground)",
    }
  }
  const step = Math.min(
    HEAT_STEPS - 1,
    Math.max(0, Math.round(value * (HEAT_STEPS - 1)))
  )
  return {
    background: `var(--heat-${step})`,
    color: step >= 5 ? "var(--heat-ink-high)" : "var(--heat-ink-low)",
  }
}

export const HEAT_LEGEND = Array.from({ length: HEAT_STEPS }, (_, i) => ({
  step: i,
  rate: i / (HEAT_STEPS - 1),
}))
