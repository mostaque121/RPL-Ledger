import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Building blocks for the invoice form, which is laid out like the invoice itself ("paper").
 * Inputs are underlined rather than boxed, so the form reads like the document being filled in.
 */
export const LINE_INPUT =
  'h-9 rounded-none border-0 border-b border-border bg-transparent px-0 shadow-none focus-visible:border-primary focus-visible:ring-0 dark:bg-transparent aria-invalid:border-danger'

/** Underlined input inside a meta row: no rule of its own (the row has one), right aligned. */
export const META_INPUT =
  'h-8 rounded-md border-0 bg-transparent px-2 text-right shadow-none hover:bg-muted focus-visible:bg-muted focus-visible:ring-0 dark:bg-transparent'

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase', className)}>{children}</p>
}

/** "Label ........ value" with a hairline below, like the invoice's number / date block. */
export function MetaRow({ label, htmlFor, children, error }: { label: string; htmlFor?: string; children: ReactNode; error?: string }) {
  return (
    <div>
      <div className="flex min-h-11 items-center justify-between gap-3 border-b">
        <label htmlFor={htmlFor} className="text-xs text-muted-foreground">
          {label}
        </label>
        <div className="flex items-center gap-1.5">{children}</div>
      </div>
      {error && <p className="mt-1 text-right text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}
