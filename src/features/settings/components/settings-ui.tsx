import type { ReactNode } from 'react'
import { Loader2Icon, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Top of a settings page: icon, title, one-line description and optional actions on the right. */
export function SettingsHeader({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: ReactNode
  description: ReactNode
  /** Usually the page's main button ("Add rate"). */
  children?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start gap-x-4 gap-y-3 border-b pb-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1 basis-56">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </header>
  )
}

/**
 * One setting: what it is and why on the left, the controls on the right
 * (stacked on phones). Rows are separated by a hairline.
 */
export function SettingsRow({
  title,
  description,
  children,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className="grid gap-4 border-b py-6 last:border-b-0 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="text-sm font-bold">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className={cn('min-w-0', className)}>{children}</div>
    </section>
  )
}

/** A labelled input while its value loads: the real label, a placeholder where the input goes. */
export function FieldSkeleton({ label, className, input = 'h-8' }: { label: ReactNode; className?: string; input?: string }) {
  return (
    <Field className={className}>
      <FieldLabel>{label}</FieldLabel>
      <Skeleton className={cn('w-full rounded-lg', input)} />
    </Field>
  )
}

/** Save / Reset for a settings form. Sticks to the bottom of the screen and lights up when there are changes. */
export function SaveBar({ dirty, pending, onReset }: { dirty: boolean; pending: boolean; onReset: () => void }) {
  return (
    <div
      className={cn(
        'sticky bottom-4 z-10 mt-2 flex items-center gap-3 rounded-xl border bg-card/95 px-4 py-2.5 backdrop-blur transition-shadow',
        dirty && 'border-primary/50 shadow-lg',
      )}
    >
      <span className={cn('size-2 shrink-0 rounded-full', dirty ? 'bg-warning' : 'bg-success')} aria-hidden />
      <span className={cn('flex-1 text-sm', dirty ? 'font-semibold' : 'text-muted-foreground')} aria-live="polite">
        {dirty ? 'Unsaved changes' : 'All changes saved'}
      </span>
      <Button type="button" variant="ghost" size="sm" disabled={!dirty || pending} onClick={onReset}>
        Reset
      </Button>
      <Button type="submit" size="sm" disabled={!dirty || pending}>
        {pending && <Loader2Icon className="animate-spin" />}
        Save changes
      </Button>
    </div>
  )
}
