import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSaveNoteMutation, type SaleNote } from '../../api/notes'
import { NoteEditor } from './NoteEditor'

type NoteDialogProps = {
  onOpenChange: (open: boolean) => void
} & ({ note: SaleNote; saleId?: never } | { note?: never; saleId: string })

/** Write a new note on a sale (`saleId`, can be pinned straight away), or edit one (`note`). */
export function NoteDialog({ note, saleId, onOpenChange }: NoteDialogProps) {
  const save = useSaveNoteMutation()

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{note ? 'Edit note' : 'Add note'}</DialogTitle>
        </DialogHeader>
        <NoteEditor
          autoFocus
          showPin={!note}
          initial={note ? { body: note.body, pinned: note.pinned } : undefined}
          saveLabel={note ? 'Save' : 'Add note'}
          pending={save.isPending}
          onCancel={() => onOpenChange(false)}
          onSave={async (v) => {
            await save.mutateAsync(
              note ? { id: note.id, saleId: note.saleId, body: v.body } : { saleId, body: v.body, pinned: v.pinned },
            )
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
