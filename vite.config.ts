import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/** Recharts and its own dependencies: only the dashboard draws charts. */
const CHARTS =
  /node_modules[\\/](recharts|victory-vendor|d3-[a-z-]+|@reduxjs|react-redux|immer|reselect|decimal\.js-light|es-toolkit|eventemitter3)[\\/]/
/** Forms: validation, form state and the date picker. Only pages and dialogs with a form load them. */
const FORMS = /node_modules[\\/](zod|react-hook-form|@hookform|react-day-picker)[\\/]/
/** Data grids and drag-to-reorder: only the list pages load them. */
const TABLES = /node_modules[\\/](@tanstack[\\/](react-table|table-core)|@dnd-kit)[\\/]/
/** Loaded on demand, each in its own chunk; everything else from node_modules is `vendor`. */
const ON_DEMAND = [CHARTS, FORMS, TABLES]
/** SheetJS: only the statement's Excel export uses it, loaded on click. */
const XLSX = /node_modules[\\/]xlsx[\\/]/
/** @react-pdf and the PDF-only packages it uses: loaded when an invoice is previewed or saved. */
const PDF =
  /node_modules[\\/](@react-pdf|@noble|pdfkit|fontkit|yoga-layout|restructure|unicode-properties|unicode-trie|linebreak|brotli|pako|fflate|png-js|jay-peg|dfa|tiny-inflate|hyphen|bidi-js|emoji-regex-xs|media-engine|color-string|color-name|hsl-to-hex|hsl-to-rgb-for-reals|abs-svg-path|parse-svg-path|normalize-svg-path|svg-arc-to-cubic-bezier|postcss-value-parser|base64-js|is-url|queue|require-from-string)[\\/]/

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  build: {
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks: they rarely change, so browsers keep them cached between deploys.
        // A group also pulls in its modules' dependencies, and the higher priority wins a module, so
        // the eager groups (react, supabase, vendor) outrank the on-demand ones (forms, tables, charts,
        // xlsx, pdf); that keeps shared helpers like `date-fns` out of the on-demand chunks.
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/, priority: 4 },
            { name: 'supabase', test: /node_modules[\\/]@supabase[\\/]/, priority: 4 },
            {
              name: 'vendor',
              test: (id: string) => /node_modules[\\/]/.test(id) && ![...ON_DEMAND, XLSX, PDF].some((group) => group.test(id)),
              priority: 3,
            },
            { name: 'forms', test: FORMS, priority: 2 },
            { name: 'tables', test: TABLES, priority: 2 },
            { name: 'charts', test: CHARTS, priority: 1 },
            { name: 'xlsx', test: XLSX, priority: 1 },
            { name: 'pdf', test: PDF, priority: 1 },
          ],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
