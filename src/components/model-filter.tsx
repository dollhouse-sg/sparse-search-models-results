/* eslint-disable react-refresh/only-export-components */
import * as React from "react"

import { results } from "@/lib/data"

type ModelFilterState = {
  /** Keys the reader has switched off. Errored models are excluded separately. */
  hidden: ReadonlySet<string>
  toggle: (key: string) => void
  showAll: () => void
}

const ModelFilterContext = React.createContext<ModelFilterState | undefined>(
  undefined
)

const STORAGE_KEY = "hidden-models"

function readStored(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return new Set()
    }

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return new Set()
    }

    const known = new Set(results.models.map((m) => m.key))
    return new Set(parsed.filter((k): k is string => known.has(k as string)))
  } catch {
    return new Set()
  }
}

function writeStored(hidden: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...hidden]))
  } catch {
    /* storage unavailable — the filter still works for this session */
  }
}

/**
 * Which models the whole dashboard draws. Ruling a model out is a judgement
 * about the benchmark rather than about one card, so it is held once here and
 * persisted, instead of being re-selected on every tab.
 */
export function ModelFilterProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [hidden, setHidden] = React.useState<Set<string>>(readStored)

  const toggle = React.useCallback((key: string) => {
    setHidden((current) => {
      const next = new Set(current)
      if (!next.delete(key)) {
        next.add(key)
      }
      writeStored(next)
      return next
    })
  }, [])

  const showAll = React.useCallback(() => {
    setHidden(() => {
      const next = new Set<string>()
      writeStored(next)
      return next
    })
  }, [])

  const value = React.useMemo(
    () => ({ hidden, toggle, showAll }),
    [hidden, toggle, showAll]
  )

  return (
    <ModelFilterContext.Provider value={value}>
      {children}
    </ModelFilterContext.Provider>
  )
}

export function useModelFilter() {
  const context = React.useContext(ModelFilterContext)

  if (context === undefined) {
    throw new Error("useModelFilter must be used within a ModelFilterProvider")
  }

  return context
}

/**
 * The models every grid renders, in corpus order so colour and row position
 * stay put as others are hidden.
 */
export function useVisibleModels() {
  const { hidden } = useModelFilter()

  return React.useMemo(
    () => results.models.filter((m) => !m.error && !hidden.has(m.key)),
    [hidden]
  )
}
