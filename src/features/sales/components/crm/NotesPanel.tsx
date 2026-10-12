import { useState } from 'react'
import { NotebookPenIcon } from 'lucide-react'
import { AddButton, SectionEmpty, SectionHeader } from '@/components/data/Section'
import { ErrorState } from '@/components/feedback/ErrorState'
import { useSaleNotesQuery } from '../../api/notes'
import { NoteCard, NoteCardSkeleton } from './NoteCard'
import { NoteDialog } from './NoteDialog'

/** The sale's notes: pinned first, then newest first. New notes are written in a dialog. */
export function NotesPanel({ saleId }: { saleId: string }) {
  const notes = useSaleNotesQuery(saleId)
  const [adding, setAdding] = useState(false)
  const all = notes.data ?? []

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={NotebookPenIcon}
        tone="info"
        title="Notes"
        count={all.length}
        action={<AddButton onClick={() => setAdding(true)}>Add note</AddButton>}
      />

      {notes.isPending ? (
        <div className="space-y-2" role="status" aria-label="Loading notes">
          {[0, 1].map((i) => (
            <NoteCardSkeleton key={i} i={i} />
          ))}
        </div>
      ) : notes.isError ? (
        <ErrorState error={notes.error} onRetry={() => void notes.refetch()} />
      ) : all.length === 0 ? (
        <SectionEmpty icon={NotebookPenIcon}>No notes yet. Write down calls, what the client said, what's next.</SectionEmpty>
      ) : (
        <div className="space-y-2">
          {all.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}

      {adding && <NoteDialog saleId={saleId} onOpenChange={setAdding} />}
    </section>
  )
}
