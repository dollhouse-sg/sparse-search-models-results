import { CpuIcon, XIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Overall } from "@/pages/Overall"
import { Queries } from "@/pages/Queries"
import { useModelFilter } from "@/components/model-filter"
import { results, shortLabel } from "@/lib/data"
import { modelColor } from "@/lib/viz"
import { cn } from "@/lib/utils"

export function App() {
  const generated = new Date(results.generated_at)

  return (
    <TooltipProvider>
      <div className="mx-auto flex max-w-[88rem] flex-col gap-5 p-4 md:p-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Sparse Retrieval Comparison
            </h1>
            <MachineBadge />
          </div>

          <ModelLegend />
        </header>

        <Separator />

        <Tabs defaultValue="overall" className="gap-5">
          <TabsList>
            <TabsTrigger value="overall">Overall</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
          </TabsList>

          <TabsContent value="overall">
            <Overall />
          </TabsContent>
          <TabsContent value="queries">
            <Queries />
          </TabsContent>
        </Tabs>

        <Separator />

        <footer className="pb-4 text-xs text-muted-foreground">
          Generated {generated.toLocaleString()}
        </footer>
      </div>
    </TooltipProvider>
  )
}

/**
 * Legend and model filter in one: the swatch that names a model is also the
 * switch that removes it from every table on every tab.
 */
function ModelLegend() {
  const { hidden, toggle, showAll } = useModelFilter()

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {results.models.map((m) => {
        if (m.error) {
          return (
            <Badge key={m.key} variant="destructive" className="font-normal">
              {shortLabel(m.key, m.label)} (failed)
            </Badge>
          )
        }

        const off = hidden.has(m.key)
        return (
          <Badge
            key={m.key}
            variant="outline"
            className={cn(
              "cursor-pointer gap-1.5 font-normal transition-opacity hover:bg-muted",
              off && "text-muted-foreground line-through opacity-50"
            )}
            render={
              <button
                type="button"
                aria-pressed={!off}
                title={`${off ? "Show" : "Hide"} ${m.label}`}
                onClick={() => toggle(m.key)}
              />
            }
          >
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-full"
              style={{ background: off ? "currentColor" : modelColor(m.key) }}
            />
            {shortLabel(m.key, m.label)}
          </Badge>
        )
      })}

      {hidden.size > 0 && (
        <Button variant="ghost" size="sm" onClick={showAll}>
          <XIcon data-icon="inline-start" />
          Show all
        </Button>
      )}
    </div>
  )
}

function MachineBadge() {
  const { machine } = results
  return (
    <HoverCard>
      <HoverCardTrigger
        render={
          <Badge
            variant="secondary"
            className="cursor-default gap-1.5 font-normal"
          >
            <CpuIcon data-icon="inline-start" />
            <span className="hidden sm:inline">CPU</span>
          </Badge>
        }
      />
      <HoverCardContent align="end" className="w-auto max-w-none text-xs">
        <dl className="flex flex-col gap-1.5">
          <Row label="CPU" value={machine.cpu || "-"} />
          <Row label="Platform" value={machine.platform} />
          <Row label="Python" value={machine.python} />
          {machine.torch && <Row label="Torch" value={machine.torch} />}
          {machine.torch_threads != null && (
            <Row label="Threads" value={String(machine.torch_threads)} />
          )}
        </dl>
      </HoverCardContent>
    </HoverCard>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 whitespace-nowrap">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-mono whitespace-nowrap">{value}</dd>
    </div>
  )
}

export default App
