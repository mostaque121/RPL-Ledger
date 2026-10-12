import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon, PinIcon } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { noteSchema, type NoteValues } from '../../schema'

interface NoteEditorProps {
  initial?: NoteValues
  /** Resolve to clear the editor (new note) or close it (edit). */
  onSave: (values: NoteValues) => Promise<unknown>
  onCancel?: () => void
  saveLabel: string
  pending: boolean
  /** Show the "Pin" toggle (new notes; existing ones pin from their own button). */
  showPin?: boolean
  autoFocus?: boolean
}

const EMPTY: NoteValues = { body: '', pinned: false }

/** Write or edit a note. Ctrl/⌘ + Enter saves. */
export function NoteEditor({ initial = EMPTY, onSave, onCancel, saveLabel, pending, showPin, autoFocus }: NoteEditorProps) {
  const form = useForm<NoteValues>({ resolver: zodResolver(noteSchema), defaultValues: initial })
  const { errors, isSubmitted } = form.formState

  const submit = form.handleSubmit(async (v) => {
    try {
      await onSave(v)
      form.reset(EMPTY)
    } catch {
      // The mutation already toasted the error; keep what was typed.
    }
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-2">
      <Textarea
        aria-label="Note"
        autoFocus={autoFocus}
        placeholder="Write a note: a call, what the client said, what's next…"
        className="max-h-80 min-h-32 bg-card"
        aria-invalid={isSubmitted && !!errors.body}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void submit()
          if (e.key === 'Escape' && onCancel) onCancel()
        }}
        {...form.register('body')}
      />
      {isSubmitted && <FieldError errors={[errors.body]} />}
      <div className="flex flex-wrap items-center gap-2">
        {showPin && (
          <Controller
            control={form.control}
            name="pinned"
            render={({ field }) => (
              <Button
                type="button"
                size="sm"
                variant="outline"
                aria-pressed={field.value}
                onClick={() => field.onChange(!field.value)}
                className={cn(field.value && 'border-warning bg-warning/15 text-warning-foreground hover:bg-warning/25 dark:text-warning')}
              >
                <PinIcon className={cn(field.value && 'fill-current')} />
                {field.value ? 'Pinned' : 'Pin'}
              </Button>
            )}
          />
        )}
        <span className="hidden text-[11px] text-muted-foreground sm:inline">Ctrl + Enter to save</span>
        <div className="ml-auto flex gap-2">
          {onCancel && (
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" size="sm" disabled={pending}>
            {pending && <Loader2Icon className="animate-spin" />}
            {saveLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
