/**
 * Term definitions.
 *
 * Rules for every string here: short, factual, no trailing period, no em dash,
 * no elaboration. Say what the thing is and stop. A tooltip defines a term or
 * reveals truncated text; it never restates a value already on screen.
 */
export const GLOSSARY: Record<string, string> = {
  "hit@1": "Correct chunk ranked first",
  "hit@3": "Correct chunk in the top 3",
  "hit@5": "Correct chunk in the top 5",
  "hit@10": "Correct chunk in the top 10",
  "@1": "Correct chunk ranked first",
  "@3": "Correct chunk in the top 3",
  "@5": "Correct chunk in the top 5",
  "@10": "Correct chunk in the top 10",

  "mrr@10": "Mean of 1/rank over the top 10",
  mrr: "Mean of 1/rank over the top 10",
  "mean rank": "Average position of the correct chunk",
  mean: "Average position of the correct chunk",
  misses: "Queries where the correct chunk missed the top 10",
  miss: "Queries where the correct chunk missed the top 10",

  "index time": "Time to encode and index the corpus",
  index: "Time to encode and index the corpus",
  "docs/s": "Documents indexed per second",
  "query mean": "Mean time to answer one query",
  "ms/q": "Median time to answer one query",
  "query p95": "95th percentile query time",
  p95: "95th percentile query time",

  "doc nnz": "Non-zero terms stored per document",
  "query nnz": "Non-zero terms in the encoded query",
  "q nnz": "Non-zero terms in the encoded query",
  nnz: "Non-zero terms a sparse vector stores",
  expansion: "Output terms per input token",
  exp: "Output terms per input token",
  size: "Encoder parameter count",
  params: "Encoder parameter count",

  easy: "Query shares distinctive tokens with its chunk",
  medium: "Query is a paraphrase with partial word overlap",
  hard: "Query is paraphrased with near-zero word overlap",

  identifier: "Query contains an error code, part number or torque spec",
  "no identifier": "Query contains no identifier",
}

/** Direction codes like "EN → KO". */
export function directionHint(
  queryLang: string,
  docLang: string,
  docs: number
) {
  const q = queryLang.toUpperCase()
  const d = docLang.toUpperCase()
  return `${q} query, ${d} documents, ${docs} candidates`
}

export function define(term: string) {
  return GLOSSARY[term.toLowerCase().trim()]
}
