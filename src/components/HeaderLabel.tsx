import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { define } from "@/lib/glossary"
import { cn } from "@/lib/utils"

/**
 * A column or row label that defines itself on hover, when it is jargon.
 *
 * Terms with a glossary entry get a dotted underline so the affordance is
 * visible rather than something you have to discover. Terms without one render
 * as plain text — an unexplained dotted underline is worse than none.
 */
export function HeaderLabel({
  term,
  children,
  hint,
  className,
}: {
  /** Looked up in the glossary; defaults to the rendered text. */
  term?: string
  children: React.ReactNode
  /** Overrides the glossary lookup. */
  hint?: string
  className?: string
}) {
  const text =
    hint ?? define(term ?? (typeof children === "string" ? children : ""))

  if (!text) return <span className={className}>{children}</span>

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn(
              "cursor-help decoration-muted-foreground/40 decoration-dotted underline-offset-[3px] hover:decoration-muted-foreground",
              "underline",
              className
            )}
          >
            {children}
          </span>
        }
      />
      <TooltipContent className="max-w-72 font-normal normal-case">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
