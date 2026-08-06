import { CpuIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CrossLingual } from "@/pages/CrossLingual"
import { Overall } from "@/pages/Overall"
import { Queries } from "@/pages/Queries"
import { results, shortLabel } from "@/lib/data"
import { modelColor } from "@/lib/viz"

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

          <div className="flex flex-wrap gap-1.5">
            {results.models.map((m) => (
              <Badge
                key={m.key}
                variant={m.error ? "destructive" : "outline"}
                className="gap-1.5 font-normal"
              >
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: modelColor(m.key) }}
                />
                {shortLabel(m.key, m.label)}
                {m.error ? " (failed)" : ""}
              </Badge>
            ))}
          </div>
        </header>

        <Separator />

        <Tabs defaultValue="overall" className="gap-5">
          <TabsList>
            <TabsTrigger value="overall">Overall</TabsTrigger>
            <TabsTrigger value="cross">Cross-lingual</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
          </TabsList>

          <TabsContent value="overall">
            <Overall />
          </TabsContent>
          <TabsContent value="cross">
            <CrossLingual />
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
