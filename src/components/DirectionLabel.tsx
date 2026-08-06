import { HeaderLabel } from "@/components/HeaderLabel"
import { directionHint } from "@/lib/glossary"
import { cn } from "@/lib/utils"
import type { Condition } from "@/types"

const LANG_COLOR: Record<string, string> = {
  en: "var(--lang-en)",
  ko: "var(--lang-ko)",
}

/**
 * "EN → KO" with each language code in its own ink, so the direction of a row
 * or column reads without parsing the text. Colour is redundant with the
 * letters themselves — it speeds recognition up rather than carrying meaning
 * on its own.
 */
export function DirectionLabel({
  cond,
  className,
  withHint = true,
}: {
  cond: Condition
  className?: string
  withHint?: boolean
}) {
  const body = (
    <span className={cn("font-mono whitespace-nowrap", className)}>
      <Lang code={cond.query_lang} />
      <span className="mx-0.5 text-muted-foreground">→</span>
      <Lang code={cond.doc_lang} />
    </span>
  )

  if (!withHint) return body

  return (
    <HeaderLabel
      hint={directionHint(cond.query_lang, cond.doc_lang, cond.n_docs)}
    >
      {body}
    </HeaderLabel>
  )
}

function Lang({ code }: { code: string }) {
  return (
    <span className="font-semibold" style={{ color: LANG_COLOR[code] }}>
      {code.toUpperCase()}
    </span>
  )
}
