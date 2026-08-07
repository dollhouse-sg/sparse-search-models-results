import { EyeOffIcon } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/** Every model is hidden, so there is nothing for a page to draw. */
export function NoModels() {
  return (
    <Empty className="rounded-lg border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <EyeOffIcon />
        </EmptyMedia>
        <EmptyTitle>No models selected</EmptyTitle>
        <EmptyDescription>
          Re-enable a model from the legend at the top of the page.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
