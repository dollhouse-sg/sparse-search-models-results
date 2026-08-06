import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), mode === "singlefile" && viteSingleFile()],
  // The standalone build inlines results.json into the bundle, so skip
  // copying public/ verbatim — it would otherwise leave a redundant,
  // unused copy of the 1 MB file next to the self-contained index.html.
  publicDir: mode === "singlefile" ? false : "public",
  resolve: {
    alias: {
      // import.meta.dirname rather than __dirname — the latter is unsupported
      // under Vite's native config loader, which becomes the default in v9.
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
}))
