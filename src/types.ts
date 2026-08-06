export type Tier = "easy" | "medium" | "hard"
export type IdGroup = "with_ids" | "prose_only" | "unannotated"

export interface ModelMeta {
  key: string
  label: string
  family: "lexical" | "learned"
  multilingual: boolean
  params_m: number | null
  notes: string
  load_s: number | null
  inference_free_query?: boolean
  error: string | null
}

export interface ModelMetrics {
  "hit@1": number
  "hit@3": number
  "hit@5": number
  "hit@10": number
  "mrr@10": number
  misses: number
  mean_rank: number | null
  by_tier: Record<Tier, number | null>
  by_identifier: Record<IdGroup, number | null>
  index_s: number
  docs_per_s: number | null
  query_ms_mean: number
  query_ms_p95: number
  doc_nnz_mean: number
  expansion_ratio: number | null
  query_nnz_mean: number
  error?: string
}

export interface TopHit {
  id: string
  score: number
  gold: boolean
}

export interface QueryModelResult {
  rank: number | null
  top5: TopHit[]
  terms: [string, number][]
}

export interface QueryResult {
  id: string
  query: string
  tier: Tier
  vendor: string
  bucket: string
  identifiers: string[]
  per_model: Record<string, QueryModelResult>
}

export interface Condition {
  key: string
  label: string
  short: string
  doc_lang: "en" | "ko"
  query_lang: "en" | "ko"
  description: string
  n_docs: number
  n_queries: number
  metrics: Record<string, ModelMetrics>
  queries: QueryResult[]
}

export interface CorpusChunk {
  id: string
  vendor: string
  bucket: string
  tier: Tier
  title: string
  text: string
  query: string
  text_ko: string | null
  query_ko: string | null
  identifiers: string[] | null
  parallel: boolean
}

export interface ResultsPayload {
  generated_at: string
  machine: {
    cpu: string
    platform: string
    python: string
    torch: string | null
    torch_threads: number | null
  }
  models: ModelMeta[]
  conditions: Condition[]
  corpus: CorpusChunk[]
}
