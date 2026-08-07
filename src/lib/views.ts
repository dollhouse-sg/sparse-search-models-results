import { chunkById, condition, results } from "@/lib/data"
import type { Condition, ModelMetrics, Tier } from "@/types"

/**
 * The conditions shown on the main page, side by side. Nothing is pooled — each
 * stays a real single-condition measurement.
 */
const PAGE_CONDITIONS = ["full_en", "par_ko_ko", "par_en_ko", "par_ko_en"]

export function pageConditions(): Condition[] {
  return PAGE_CONDITIONS.map(condition)
}

/** "EN → EN", derived from the condition rather than hardcoded per key. */
export function directionLabel(c: Condition) {
  return `${c.query_lang.toUpperCase()} → ${c.doc_lang.toUpperCase()}`
}

export const RANK_BUCKETS = [
  { key: "r1", label: "#1", lo: 1, hi: 1, color: "var(--rank-1)" },
  { key: "r2", label: "2–3", lo: 2, hi: 3, color: "var(--rank-2)" },
  { key: "r3", label: "4–5", lo: 4, hi: 5, color: "var(--rank-3)" },
  { key: "r4", label: "6–10", lo: 6, hi: 10, color: "var(--rank-4)" },
  { key: "r5", label: ">10", lo: 11, hi: Infinity, color: "var(--rank-5)" },
] as const

/**
 * Where the gold chunk actually landed, bucketed. `rank` is uncapped in the
 * source (max observed 84), so a miss is rank > 10 rather than a null.
 */
export function rankHistogram(conditionKey: string, modelKey: string) {
  const qs = condition(conditionKey).queries
  return RANK_BUCKETS.map((b) => {
    const n = qs.filter((q) => {
      const r = q.per_model[modelKey]?.rank
      if (r == null) return b.hi === Infinity
      return r >= b.lo && r <= b.hi
    }).length
    return { ...b, n, share: qs.length ? n / qs.length : 0 }
  })
}

type Dimension = "vendor" | "bucket" | "tier"

/**
 * hit@5 split by a per-query dimension. Vendor and section are not published in
 * the metrics block but are derivable, and section is the widest unshown spread
 * in the file (commissioning runs 60% to 93% across models).
 */
export function byDimension(
  conditionKey: string,
  modelKey: string,
  dim: Dimension
) {
  const qs = condition(conditionKey).queries
  const groups = new Map<string, { hits: number; n: number }>()
  for (const q of qs) {
    const g = String(q[dim])
    const entry = groups.get(g) ?? { hits: 0, n: 0 }
    const r = q.per_model[modelKey]?.rank
    entry.n += 1
    if (r != null && r <= 5) entry.hits += 1
    groups.set(g, entry)
  }
  return [...groups.entries()]
    .map(([group, { hits, n }]) => ({ group, n, rate: n ? hits / n : 0 }))
    .sort((a, b) => a.group.localeCompare(b.group))
}

/**
 * Chunks not hand-annotated for identifiers carry `identifiers: null` in the
 * corpus. The per-query records flatten that null to `[]`, which makes an
 * unannotated chunk indistinguishable from a genuinely prose-only one — so
 * annotation status has to be read from the corpus, not from the query.
 * Getting this wrong silently folds unannotated queries into "prose only" and
 * inflates it.
 */
export function isAnnotated(queryId: string) {
  return chunkById(queryId)?.identifiers != null
}

/** Queries carrying an error code / part number / torque spec, and those not. */
export function byIdentifier(conditionKey: string, modelKey: string) {
  const qs = condition(conditionKey).queries.filter((q) => isAnnotated(q.id))
  const split = (want: boolean) => {
    const g = qs.filter((q) => q.identifiers.length > 0 === want)
    const hits = g.filter((q) => {
      const r = q.per_model[modelKey]?.rank
      return r != null && r <= 5
    }).length
    return { n: g.length, rate: g.length ? hits / g.length : 0 }
  }
  return { withIds: split(true), proseOnly: split(false) }
}

/**
 * Cost varies up to 3.5x across conditions inside one page (SPLADE runs 91 ms
 * on English and 322 ms on Korean, which tokenises longer), so it is reported
 * as a range rather than collapsed into a mean that describes no real run.
 */
export function costRange(conditions: Condition[], modelKey: string) {
  const ms = conditions
    .map((c) => c.metrics[modelKey])
    .filter((m): m is ModelMetrics => !!m && !m.error)

  const span = (pick: (m: ModelMetrics) => number | null) => {
    const vs = ms.map(pick).filter((v): v is number => v != null)
    if (vs.length === 0) return null
    return { min: Math.min(...vs), max: Math.max(...vs) }
  }

  /** Median rather than a range: one representative run, not a spread. */
  const mid = (pick: (m: ModelMetrics) => number | null) => {
    const vs = ms
      .map(pick)
      .filter((v): v is number => v != null)
      .sort((a, b) => a - b)
    if (vs.length === 0) return 0
    const h = Math.floor(vs.length / 2)
    return vs.length % 2 ? vs[h] : (vs[h - 1] + vs[h]) / 2
  }

  return {
    queryMsMedian: mid((m) => m.query_ms_mean),
    queryP95Median: mid((m) => m.query_ms_p95),
    docNnzMedian: mid((m) => m.doc_nnz_mean),
    queryNnzMedian: mid((m) => m.query_nnz_mean),
    expansionMedian: mid((m) => m.expansion_ratio),
    indexSMedian: mid((m) => m.index_s),
    docsPerSMedian: mid((m) => m.docs_per_s),
    queryMs: span((m) => m.query_ms_mean),
    queryP95: span((m) => m.query_ms_p95),
    indexS: span((m) => m.index_s),
    docsPerS: span((m) => m.docs_per_s),
    docNnz: span((m) => m.doc_nnz_mean),
    queryNnz: span((m) => m.query_nnz_mean),
    expansion: span((m) => m.expansion_ratio),
  }
}

export interface SummaryRow {
  meta: (typeof results.models)[number]
  /** 1-based standing by pooled hit@5, carried as a column rather than as row order. */
  rank: number
  /** Rate over every query run on the page, weighted by each condition's size. */
  hit1: number
  hit5: number
  hit10: number
  mrr: number
  runs: number
  /** hit@5 kept separate per condition, since the pooled figure hides the spread. */
  perCondition: { key: string; label: string; value: number }[]
  cost: ReturnType<typeof costRange>
}

/**
 * One row per model for the top-of-page comparison, in corpus order.
 *
 * Ordering by score would put the same six models in a different sequence here
 * than in every grid below, so the standing is reported as a `rank` column and
 * row order stays the one the rest of the page uses.
 *
 * The pooled rates are weighted by query count across exactly the conditions on
 * the page — on Overall that is all 240 runs covering all 120 corpus queries.
 * They are a genuine mean over the page's scope, but on Overall they span two
 * candidate-pool sizes (120 and 40 docs), so the per-condition columns are kept
 * alongside rather than replaced: a single number cannot show that a model sits
 * at 98% in one direction and 40% in another.
 */
export function summaryRows(
  conditions: Condition[],
  models: (typeof results.models)[number][]
): SummaryRow[] {
  const rows = models
    .filter(
      (m) =>
        !m.error &&
        conditions.every((c) => c.metrics[m.key] && !c.metrics[m.key].error)
    )
    .map((meta) => {
      const ranks = conditions.flatMap((c) =>
        c.queries.map((q) => q.per_model[meta.key]?.rank ?? null)
      )
      const runs = ranks.length
      const within = (k: number) =>
        ranks.filter((r) => r != null && r <= k).length / runs

      const perCondition = conditions.map((c) => ({
        key: c.key,
        label: directionLabel(c),
        value: c.metrics[meta.key]["hit@5"],
      }))
      return {
        meta,
        hit1: within(1),
        hit5: within(5),
        hit10: within(10),
        mrr:
          ranks.reduce<number>(
            (sum, r) => sum + (r != null && r <= 10 ? 1 / r : 0),
            0
          ) / runs,
        runs,
        perCondition,
        cost: costRange(conditions, meta.key),
      }
    })

  // Standing by pooled hit@5, ties sharing a number.
  const byHit5 = [...rows].sort((a, b) => b.hit5 - a.hit5)
  return rows.map((r) => ({
    ...r,
    rank: byHit5.findIndex((x) => x.hit5 === r.hit5) + 1,
  }))
}

type Span = { min: number; max: number } | null

/** "0.21–0.80 ms" or "0.21 ms" when the range is degenerate. */
export function fmtSpan(s: Span, fmt: (v: number) => string) {
  if (!s) return "-"
  const lo = fmt(s.min)
  const hi = fmt(s.max)
  return lo === hi ? lo : `${lo}–${hi}`
}

export const TIER_ORDER_TYPED: Tier[] = ["easy", "medium", "hard"]

/** Every published metric, in the order the detail grid lists them. */
export const METRIC_FIELDS = [
  { key: "hit@1", label: "hit@1", kind: "pct" },
  { key: "hit@3", label: "hit@3", kind: "pct" },
  { key: "hit@5", label: "hit@5", kind: "pct" },
  { key: "hit@10", label: "hit@10", kind: "pct" },
  { key: "mrr@10", label: "MRR@10", kind: "fixed3" },
  { key: "misses", label: "misses", kind: "int" },
  { key: "mean_rank", label: "mean rank", kind: "fixed2" },
  { key: "index_s", label: "index time", kind: "seconds" },
  { key: "docs_per_s", label: "docs/s", kind: "fixed1" },
  { key: "query_ms_mean", label: "query mean", kind: "ms" },
  { key: "query_ms_p95", label: "query p95", kind: "ms" },
  { key: "doc_nnz_mean", label: "doc nnz", kind: "fixed1" },
  { key: "query_nnz_mean", label: "query nnz", kind: "fixed1" },
  { key: "expansion_ratio", label: "expansion", kind: "times" },
] as const

export type MetricKind = (typeof METRIC_FIELDS)[number]["kind"]

export function fmtMetric(kind: MetricKind, v: number | null | undefined) {
  if (v == null) return "-"
  switch (kind) {
    case "pct":
      return `${Math.round(v * 100)}%`
    case "fixed3":
      return v.toFixed(3)
    case "fixed2":
      return v.toFixed(2)
    case "fixed1":
      return v.toLocaleString(undefined, { maximumFractionDigits: 1 })
    case "int":
      return String(v)
    case "seconds":
      return v < 10 ? `${v.toFixed(3)}s` : `${v.toFixed(1)}s`
    case "ms":
      return v < 1
        ? `${v.toFixed(2)} ms`
        : v < 10
          ? `${v.toFixed(1)} ms`
          : `${Math.round(v)} ms`
    case "times":
      return `${v.toFixed(2)}×`
  }
}

export function metricValue(m: ModelMetrics, key: string): number | null {
  return (m as unknown as Record<string, number | null>)[key] ?? null
}
