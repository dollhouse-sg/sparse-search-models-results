import type { ResultsPayload } from "@/types"

/**
 * Fetched rather than imported. As a JSON import Vite inlines all 1 MB into the
 * JS bundle, where it has to be parsed as JavaScript source; served as a static
 * asset the browser uses its much faster JSON parser and can cache the dataset
 * separately from the app code.
 *
 * The `singlefile` build mode (`npm run build:standalone`) is the exception: it
 * produces one offline HTML file with no server to fetch from, so it dynamically
 * imports the JSON and lets vite-plugin-singlefile inline it into the bundle.
 *
 * The top-level await keeps every consumer synchronous — the module graph
 * resolves before the first component renders, so nothing downstream needs to
 * handle a loading state.
 */
const raw =
  import.meta.env.MODE === "singlefile"
    ? ((await import("../../public/results.json")).default as unknown)
    : await fetch(`${import.meta.env.BASE_URL}results.json`).then((r) => {
        if (!r.ok) throw new Error(`Could not load results.json (${r.status})`)
        return r.json()
      })

export const results = raw as ResultsPayload

export function condition(key: string) {
  return results.conditions.find((c) => c.key === key)!
}

export function chunkById(id: string) {
  return results.corpus.find((c) => c.id === id)
}

export const SHORT_LABEL: Record<string, string> = {
  bm25: "BM25",
  tfidf: "TF-IDF",
  splade: "SPLADE",
  opensearch_en: "OS v3",
  opensearch_multi: "OS mul.",
  bgem3: "BGE-M3",
}

export function shortLabel(key: string, fallback: string) {
  return SHORT_LABEL[key] ?? fallback
}

export function fmtPct(v: number | null | undefined) {
  if (v == null) return "-"
  return `${Math.round(v * 100)}%`
}

export function fmtMs(v: number | null | undefined) {
  if (v == null) return "-"
  if (v < 1) return `${v.toFixed(2)} ms`
  if (v < 10) return `${v.toFixed(1)} ms`
  return `${Math.round(v)} ms`
}

export function fmtS(v: number | null | undefined) {
  if (v == null) return "-"
  return v < 10 ? `${v.toFixed(2)}s` : `${v.toFixed(1)}s`
}
