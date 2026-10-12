import { useState, type ReactNode } from 'react'
import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  /** `danger` for deletes, `default` for everything else. */
  tone?: 'danger' | 'default'
  /** May be async. The dialog stays open with a spinner until it settles, and closes only on success. */
  onConfirm: () => unknown
}

/** "Are you sure?" before anything destructive. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false)

  async function confirm() {
    setPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch {
      // The caller already reported the error (mutations toast it). Keep the dialog open.
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            autoFocus
            disabled={pending}
            onClick={confirm}
            className={tone === 'danger' ? 'bg-danger text-danger-foreground hover:bg-danger/85' : undefined}
          >
            {pending && <Loader2Icon className="animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
