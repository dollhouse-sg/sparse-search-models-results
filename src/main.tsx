import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./index.css"
import App from "./App.tsx"
import { ModelFilterProvider } from "@/components/model-filter.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <ModelFilterProvider>
        <App />
      </ModelFilterProvider>
    </ThemeProvider>
  </StrictMode>
)
