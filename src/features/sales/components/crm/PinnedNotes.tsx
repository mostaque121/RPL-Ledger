import { PinIcon } from 'lucide-react'
import { useSaleNotesQuery } from '../../api/notes'
import { NoteCard } from './NoteCard'

/** Pinned notes, right under the sale header so they're seen first. Nothing when there are none. */
export function PinnedNotes({ saleId }: { saleId: string }) {
  const pinned = (useSaleNotesQuery(saleId).data ?? []).filter((n) => n.pinned)
  if (pinned.length === 0) return null

  return (
    <section aria-label="Pinned notes" className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
        <PinIcon className="size-3.5" />
        Pinned
      </h2>
      <div className="grid gap-2 md:grid-cols-2">
        {pinned.map((n) => (
          <NoteCard key={n.id} note={n} />
        ))}
      </div>
    </section>
  )
}
