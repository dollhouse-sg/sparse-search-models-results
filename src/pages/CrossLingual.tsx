import { BenchmarkPage } from "@/components/BenchmarkPage"
import { viewConditions } from "@/lib/views"

/** The 40 parallel chunks, every direction against an identical 40-document pool. */
export function CrossLingual() {
  return <BenchmarkPage conditions={viewConditions("cross_lingual")} />
}
