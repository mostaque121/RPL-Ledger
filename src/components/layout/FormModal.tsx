import type { CSSProperties, ReactNode } from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInsetContainer } from './inset-context'

interface FormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** `<FormModalHeader>`, `<FormModalBody>` and `<FormModalFooter>`. Mounted only while open. */
  children: ReactNode
  /** Accessible name when there's no visible `<FormModalHeader>` title. */
  'aria-label'?: string
}

/**
 * A full-page form. On desktop it fills the content area beside the sidebar; on phones, the whole
 * screen. Slides up from the bottom. Escape / ✕ call `onOpenChange(false)`, so the owner decides
 * (e.g. ask first when there are unsaved changes).
 *
 * Not "modal" in the Radix sense: the sidebar stays usable (its links simply navigate away, which
 * the owner's unsaved-changes guard can catch), and clicks outside don't close it.
 *
 * Compose the inside with `FormModalHeader` (✕, title, actions on ≥ sm), `FormModalBody` (scrolls)
 * and `FormModalFooter` (the same actions, sticky at the bottom on phones).
 */
export function FormModal({ open, onOpenChange, children, ...aria }: FormModalProps) {
  const container = useInsetContainer()
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPrimitive.Portal container={container}>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          aria-label={aria['aria-label']}
          // Only ✕, Escape or the owner close it — never a click elsewhere (e.g. the sidebar).
          onInteractOutside={(e) => e.preventDefault()}
          // Focus the modal itself rather than the ✕ (no stray focus ring); Tab still starts inside it.
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            ;(e.currentTarget as HTMLElement).focus()
          }}
          className={cn(
            'fixed inset-0 z-40 flex flex-col overflow-hidden bg-background shadow-2xl outline-none will-change-transform md:absolute md:rounded-xl',
            // A full-height sheet: slides up on an iOS-style curve, drops away a little quicker.
            'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=open]:duration-500 data-[state=open]:ease-[cubic-bezier(0.32,0.72,0,1)]',
            'data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=closed]:duration-300 data-[state=closed]:ease-[cubic-bezier(0.4,0,1,1)]',
          )}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface WidthProps {
  /** Caps the inner width so forms stay readable on big screens, e.g. `56rem`. */
  maxWidth?: string
}

const inner = (maxWidth?: string): CSSProperties | undefined => (maxWidth ? { maxWidth } : undefined)

export function FormModalHeader({
  title,
  eyebrow,
  actions,
  maxWidth,
}: WidthProps & { title: ReactNode; eyebrow?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="shrink-0 border-b bg-card px-3 sm:px-6">
      <div className="mx-auto flex h-14 w-full items-center justify-between gap-3" style={inner(maxWidth)}>
        <div className="flex min-w-0 items-center gap-2">
          <DialogPrimitive.Close className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <XIcon className="size-5" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
          {/* One line, like the top bar: the title, then the eyebrow as a quiet note (hidden on phones). */}
          <div className="flex min-w-0 items-baseline gap-2.5">
            <DialogPrimitive.Title className="truncate text-lg font-extrabold tracking-tight">{title}</DialogPrimitive.Title>
            {eyebrow && <p className="hidden truncate text-xs font-medium text-muted-foreground sm:block">{eyebrow}</p>}
          </div>
        </div>
        {actions && <div className="hidden shrink-0 items-center gap-2 sm:flex">{actions}</div>}
      </div>
    </div>
  )
}

export function FormModalBody({ children, maxWidth, className }: WidthProps & { children: ReactNode; className?: string }) {
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-6 sm:py-8">
      <div className={cn('mx-auto w-full', className)} style={inner(maxWidth)}>
        {children}
      </div>
    </div>
  )
}

/** Phones only: the header hides its actions there, so they live here, within thumb reach. */
export function FormModalFooter({ children, maxWidth }: WidthProps & { children: ReactNode }) {
  return (
    <div
      className="shrink-0 border-t bg-card px-4 pt-3 sm:hidden"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto flex w-full items-center gap-2 *:flex-1" style={inner(maxWidth)}>
        {children}
      </div>
    </div>
  )
}
