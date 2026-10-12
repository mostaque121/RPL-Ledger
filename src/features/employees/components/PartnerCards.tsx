import { CrownIcon, PencilIcon } from 'lucide-react'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { Button } from '@/components/ui/button'
import type { Person } from '../api'

interface PartnerCardsProps {
  partners: Person[]
  /** Share % by partner key, from Settings. */
  shares: { tanvir: number; md: number }
  onEdit: (person: Person) => void
}

/** Tanvir first, then MD (the people list itself is sorted by name). */
const ORDER = { tanvir: 0, md: 1 } as const
const rank = (p: Person) => (p.partnerKey ? ORDER[p.partnerKey] : 2)

const CARD = 'flex items-center gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10'

function CrownBadge() {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sidebar text-sidebar-primary">
      <CrownIcon className="size-5" />
    </span>
  )
}

/** The two partner cards while people load: same cards, the name and share waiting. */
export function PartnerCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
      {[0, 1].map((i) => (
        <div key={i} className={CARD}>
          <CrownBadge />
          <div className="min-w-0 flex-1">
            <SkeletonText size="base" className={i ? 'w-14' : 'w-20'} />
            <SkeletonText size="xs" className="w-28" />
          </div>
          <div className="text-right">
            <SkeletonText size="2xl" align="right" className="w-14" />
            <p className="text-[11px] text-muted-foreground">of shared items</p>
          </div>
          <span className="size-7" />
        </div>
      ))}
    </div>
  )
}

/** Tanvir and MD: their share of shared profit and expenses. Partners can be renamed, never removed. */
export function PartnerCards({ partners, shares, onEdit }: PartnerCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[...partners].sort((a, b) => rank(a) - rank(b)).map((p) => (
        <div key={p.id} className={CARD}>
          <CrownBadge />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold">{p.name}</p>
            <p className="text-xs text-muted-foreground">Partner · {p.historyCount} records</p>
          </div>
          <div className="text-right">
            <p className="money text-2xl font-extrabold text-primary">{p.partnerKey ? shares[p.partnerKey] : 0}%</p>
            <p className="text-[11px] text-muted-foreground">of shared items</p>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label={`Rename ${p.name}`} onClick={() => onEdit(p)}>
            <PencilIcon />
          </Button>
        </div>
      ))}
    </div>
  )
}
