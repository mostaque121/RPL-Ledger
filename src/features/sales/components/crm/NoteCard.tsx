import { useState } from 'react'
import { PencilIcon, PinIcon, PinOffIcon, Trash2Icon } from 'lucide-react'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { LIST_CARD } from '@/components/data/Section'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useDeleteNoteMutation, useSetNotePinnedMutation, type SaleNote } from '../../api/notes'
import { NoteDialog } from './NoteDialog'

/** A note while loading: two lines of text and its date. */
export function NoteCardSkeleton({ i }: { i: number }) {
  return (
    <div aria-hidden className={cn(LIST_CARD, 'hover:shadow-none')}>
      <SkeletonText className="w-full" />
      <SkeletonText className={i % 2 ? 'w-1/2' : 'w-2/3'} />
      <div className="mt-2 flex h-6 items-center">
        <SkeletonText size="11px" className="w-28" />
      </div>
    </div>
  )
}

/** One note: read, pin / unpin, edit (in a dialog), delete. Pinned notes get the warm highlight. */
export function NoteCard({ note }: { note: SaleNote }) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const pin = useSetNotePinnedMutation()
  const remove = useDeleteNoteMutation()
  const pinned = pin.isPending ? pin.variables.pinned : note.pinned

  return (
    <article className={cn('group', LIST_CARD, pinned && 'bg-warning/10 ring-warning/40')}>
      <div className="flex items-start gap-2">
        {pinned && <PinIcon className="mt-0.5 size-3.5 shrink-0 fill-current text-warning-foreground dark:text-warning" />}
        <p className="min-w-0 flex-1 text-sm wrap-break-word whitespace-pre-wrap">{note.body}</p>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <time dateTime={note.createdAt} className="flex-1 text-[11px] text-muted-foreground">
          {formatDateTime(note.createdAt)}
        </time>
        <div className="flex opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={pinned ? 'Unpin note' : 'Pin note'}
            title={pinned ? 'Unpin' : 'Pin to the top'}
            disabled={pin.isPending}
            onClick={() => pin.mutate({ id: note.id, pinned: !pinned })}
          >
            {pinned ? <PinOffIcon /> : <PinIcon />}
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Edit note" onClick={() => setEditing(true)}>
            <PencilIcon />
          </Button>
          <Button variant="ghost" size="icon-xs" className="hover:text-danger" aria-label="Delete note" onClick={() => setDeleting(true)}>
            <Trash2Icon />
          </Button>
        </div>
      </div>

      {editing && <NoteDialog note={note} onOpenChange={setEditing} />}
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete this note?"
        description="This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => remove.mutateAsync(note.id)}
      />
    </article>
  )
}
