import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorScreenProps {
  icon: LucideIcon
  title: string
  description: ReactNode
  /** Buttons. */
  children?: ReactNode
  /** Technical detail, folded away. */
  detail?: string
  className?: string
}

/** A whole-page message (crash, not found, new version). Used inside the app frame and full screen. */
export function ErrorScreen({ icon: Icon, title, description, children, detail, className }: ErrorScreenProps) {
  return (
    <div role="alert" className={cn('mx-auto flex max-w-md flex-col items-center py-16 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
        <Icon className="size-6" />
      </span>
      <h2 className="mt-4 text-xl font-extrabold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>}
      {detail && (
        <details className="mt-6 w-full text-left text-xs text-muted-foreground">
          <summary className="cursor-pointer text-center">Technical details</summary>
          <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-muted p-3 font-mono whitespace-pre-wrap">{detail}</pre>
        </details>
      )}
    </div>
  )
}
