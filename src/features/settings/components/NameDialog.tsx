import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { NameListApi, NamedItem } from '../api/name-list'
import { nameSchema, type NameValues } from '../schema'
import type { NameListCopy } from './NameListManager'

interface NameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  api: NameListApi
  copy: NameListCopy
  /** The item to rename, or undefined to add a new one. */
  item?: NamedItem
}

/** Add or rename one item of a name list (RTO, course). */
export function NameDialog({ open, onOpenChange, api, copy, item }: NameDialogProps) {
  const create = api.useCreateMutation()
  const update = api.useUpdateMutation()
  const pending = create.isPending || update.isPending
  const form = useForm<NameValues>({ resolver: zodResolver(nameSchema), values: { name: item?.name ?? '' } })
  const { errors } = form.formState

  function submit({ name }: NameValues) {
    const close = { onSuccess: () => onOpenChange(false) }
    if (item) update.mutate({ id: item.id, name }, close)
    else create.mutate(name, close)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{item ? `Rename ${item.name}` : `Add ${copy.one}`}</DialogTitle>
          <DialogDescription>{item ? 'Existing sales show the new name.' : copy.addHint}</DialogDescription>
        </DialogHeader>

        <form id="name-form" onSubmit={form.handleSubmit(submit)} noValidate>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor="name-input">Name</FieldLabel>
            <Input
              id="name-input"
              autoFocus
              autoComplete="off"
              placeholder={copy.placeholder}
              aria-invalid={!!errors.name}
              {...form.register('name')}
            />
            <FieldError errors={[errors.name]} />
          </Field>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="name-form" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            {item ? 'Save' : `Add ${copy.one}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
