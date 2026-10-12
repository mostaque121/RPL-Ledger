import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Combobox } from '@/components/forms/Combobox'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { SaleView } from '@/features/sales/api/sales'
import { useSaveTaskMutation } from '@/features/sales/api/tasks'
import { DueDateField } from '@/features/sales/components/crm/DueDateField'
import { newTaskSchema, type NewTaskValues } from '@/features/sales/schema'
import { formatDate } from '@/lib/format'

interface NewTaskDialogProps {
  onOpenChange: (open: boolean) => void
  sales: SaleView[]
}

const GROUPS = ['Open', 'Completed', 'Cancelled'] as const

/** Add a task from the Tasks page: what, when, and (optionally) which sale it's about. */
export function NewTaskDialog({ onOpenChange, sales }: NewTaskDialogProps) {
  const save = useSaveTaskMutation()
  const form = useForm<NewTaskValues>({
    resolver: zodResolver(newTaskSchema),
    defaultValues: { saleId: '', title: '', dueOn: null },
  })
  const { errors } = form.formState

  // Grouped Open → Completed → Cancelled; newest first within a group (the order sales arrive in).
  const options = useMemo(
    () =>
      sales
        .map((s) => ({
          value: s.id,
          label: s.clientName,
          hint: formatDate(s.saleDate),
          group: GROUPS[s.cancelled ? 2 : s.completedOn ? 1 : 0],
        }))
        .sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group)),
    [sales],
  )

  function submit(v: NewTaskValues) {
    save.mutate({ saleId: v.saleId || null, title: v.title, dueOn: v.dueOn }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">New task</DialogTitle>
          <DialogDescription>A to-do for you. Link it to a sale if it's about a client.</DialogDescription>
        </DialogHeader>
        <form id="new-task-form" onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="new-task-title">Task</FieldLabel>
              <Input
                id="new-task-title"
                autoFocus
                autoComplete="off"
                placeholder="e.g. Ask for the USI, Pay the HubSpot bill"
                aria-invalid={!!errors.title}
                {...form.register('title')}
              />
              <FieldError errors={[errors.title]} />
            </Field>
            <Field data-invalid={!!errors.dueOn}>
              <FieldLabel htmlFor="new-task-due">Due</FieldLabel>
              <Controller
                control={form.control}
                name="dueOn"
                render={({ field }) => <DueDateField id="new-task-due" value={field.value} onChange={field.onChange} />}
              />
              <FieldError errors={[errors.dueOn]} />
            </Field>
            <Field data-invalid={!!errors.saleId}>
              <FieldLabel htmlFor="new-task-sale">
                Sale <span className="font-normal text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Controller
                control={form.control}
                name="saleId"
                render={({ field }) => (
                  <Combobox
                    id="new-task-sale"
                    value={field.value || null}
                    onChange={(v) => field.onChange(v ?? '')}
                    options={options}
                    clearable
                    placeholder="None: a general task"
                    searchPlaceholder="Search clients…"
                    invalid={!!errors.saleId}
                  />
                )}
              />
              <FieldDescription className="text-xs">Link it to a client's sale, or leave empty for a general task.</FieldDescription>
              <FieldError errors={[errors.saleId]} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="new-task-form" disabled={save.isPending}>
            {save.isPending && <Loader2Icon className="animate-spin" />}
            Add task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
