import { Tabs } from 'radix-ui'
import { UnderlineTabsList, UnderlineTabsTrigger } from '@/components/data/UnderlineTabs'
import type { OwnerFilter } from '../filters'

const TABS: { value: OwnerFilter; label: string; tone?: 'warning' }[] = [
  { value: 'all', label: 'All sales' },
  { value: 'mine', label: 'Sold by me' },
  { value: 'others', label: 'Sold by others' },
  { value: 'rtoDue', label: 'RTO payment pending', tone: 'warning' },
]

interface SalesTabsProps {
  value: OwnerFilter
  onChange: (value: OwnerFilter) => void
  /** How many sales each tab would show, with the other filters applied. Null while sales load. */
  counts: Record<OwnerFilter, number> | null
}

/** Whose sales (all, Tanvir's own, everyone else's), plus the RTO-payment-pending lookup. Same style as the sale page's tabs. */
export function SalesTabs({ value, onChange, counts }: SalesTabsProps) {
  return (
    <Tabs.Root value={value} onValueChange={(v) => onChange(v as OwnerFilter)}>
      <UnderlineTabsList aria-label="Whose sales">
        {TABS.map((t) => (
          <UnderlineTabsTrigger key={t.value} value={t.value} count={counts?.[t.value]} countPending={!counts} tone={t.tone} showZero>
            {t.label}
          </UnderlineTabsTrigger>
        ))}
      </UnderlineTabsList>
    </Tabs.Root>
  )
}
