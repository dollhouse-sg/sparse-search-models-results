import { BenchmarkPage } from "@/components/BenchmarkPage"
import { viewConditions } from "@/lib/views"

/** All 120 corpus queries: full English corpus plus the three Korean directions. */
export function Overall() {
  return <BenchmarkPage conditions={viewConditions("overall")} />
}
