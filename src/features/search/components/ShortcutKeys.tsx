import { Kbd } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import type { Shortcut } from '../shortcuts'

/** `N`, or `G` then `S` for a sequence. */
export function ShortcutKeys({ keys, className }: { keys: Shortcut; className?: string }) {
  return (
    <span className={cn('flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground', className)}>
      {keys.map((key, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span>then</span>}
          <Kbd>{key}</Kbd>
        </span>
      ))}
    </span>
  )
}
