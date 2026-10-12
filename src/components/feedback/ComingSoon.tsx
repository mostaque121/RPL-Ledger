import type { LucideIcon } from 'lucide-react'

interface ComingSoonProps {
  icon: LucideIcon
  phase: number
  items: string[]
}

/** Placeholder for a page that a later roadmap phase will build. */
export function ComingSoon({ icon: Icon, phase, items }: ComingSoonProps) {
  return (
    <div className="rounded-xl border-2 border-dashed bg-card p-8 sm:p-10">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Icon className="size-6" />
        </span>
        <p className="mt-4 text-xs font-bold tracking-widest text-primary uppercase">Phase {phase}</p>
        <h2 className="mt-1 text-lg font-bold">Coming next</h2>
        <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
