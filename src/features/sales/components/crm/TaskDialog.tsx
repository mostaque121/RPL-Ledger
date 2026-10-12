import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useSaveTaskMutation, type SaleTask } from '../../api/tasks'
import { taskSchema, type TaskValues } from '../../schema'
import { DueDateField } from './DueDateField'

type TaskDialogProps = {
  onOpenChange: (open: boolean) => void
} & ({ task: SaleTask; saleId?: never } | { task?: never; saleId: string })

/** Add a task to a sale (`saleId`), or edit one (`task`): title and due date. */
export function TaskDialog({ task, saleId, onOpenChange }: TaskDialogProps) {
  const save = useSaveTaskMutation()
  const form = useForm<TaskValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: { title: task?.title ?? '', dueOn: task?.dueOn ?? null },
  })
  const { errors } = form.formState

  function submit(v: TaskValues) {
    save.mutate({ id: task?.id, saleId: task ? task.saleId : saleId, title: v.title, dueOn: v.dueOn }, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">{task ? 'Edit task' : 'Add task'}</DialogTitle>
        </DialogHeader>
        <form id="task-form" onSubmit={form.handleSubmit(submit)} noValidate>
          <FieldGroup>
            <Field data-invalid={!!errors.title}>
              <FieldLabel htmlFor="task-title">Task</FieldLabel>
              <Input id="task-title" autoFocus placeholder="e.g. Ask for the USI" autoComplete="off" aria-invalid={!!errors.title} {...form.register('title')} />
              <FieldError errors={[errors.title]} />
            </Field>
            <Field data-invalid={!!errors.dueOn}>
              <FieldLabel htmlFor="task-due">Due</FieldLabel>
              <Controller
                control={form.control}
                name="dueOn"
                render={({ field }) => <DueDateField id="task-due" value={field.value} onChange={field.onChange} />}
              />
              <FieldError errors={[errors.dueOn]} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" disabled={save.isPending}>
            {save.isPending && <Loader2Icon className="animate-spin" />}
            {task ? 'Save' : 'Add task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
