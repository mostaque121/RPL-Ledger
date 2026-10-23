import { useRef, useState, type FormEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react'
import { CheckIcon, CopyIcon, PencilIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { UNDERLINE } from './inline-edit-styles'

const PENCIL = 'size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/inline:opacity-100'

/** The value and a pencil that shows on hover, inside an inline picker trigger. */
export function InlineTriggerContent({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="min-w-0 flex-1 wrap-break-word">{children}</span>
      <PencilIcon className={PENCIL} aria-hidden />
    </>
  )
}

interface InlineTextProps {
  value: string | null
  /** Gets the trimmed text ('' = cleared). Reject to keep the field open (the mutation shows the error). */
  onSave: (value: string) => Promise<unknown>
  /** An error message, or null when the text is fine. */
  validate?: (value: string) => string | null
  /** What shows when not editing; defaults to the value. Links in it still open. */
  display?: ReactNode
  type?: 'text' | 'email' | 'tel' | 'url'
  placeholder?: string
  /** Names the field for screen readers, e.g. "Phone". */
  label: string
  /** Shows a copy button (on hover) when there is a value. */
  copyable?: boolean
}

/** Click to edit a text value in place: Enter or clicking away saves, Esc cancels. */
export function InlineText({
  value,
  onSave,
  validate,
  display,
  type = 'text',
  placeholder,
  label,
  copyable,
}: InlineTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // Esc and Enter unmount the input, which may still fire a blur; that blur must not save again.
  const done = useRef(false)
  const [copied, setCopied] = useState(false)

  async function copy() {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} copied`)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error("Couldn't copy. Select the text and copy it instead.")
    }
  }

  function start() {
    setDraft(value ?? '')
    setError(null)
    done.current = false
    setEditing(true)
  }

  function stop() {
    done.current = true
    setEditing(false)
  }

  async function save(e?: FormEvent) {
    e?.preventDefault()
    if (done.current || saving) return
    const text = draft.trim()
    if (text === (value ?? '')) return stop()
    const problem = validate?.(text) ?? null
    setError(problem)
    if (problem) return
    setSaving(true)
    try {
      await onSave(text)
      stop()
    } catch {
      // keep the field open so the text isn't lost
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation() // don't close a surrounding dialog
      stop()
    }
  }

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('a, button')) return // let links open
    start()
  }

  if (editing) {
    return (
      <form onSubmit={save}>
        <Input
          autoFocus
          type={type}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => void save()}
          placeholder={placeholder}
          disabled={saving}
          aria-label={label}
          aria-invalid={!!error}
          className="h-auto rounded-none border-0 border-b border-primary bg-transparent px-0 py-1 font-medium shadow-none focus-visible:border-primary focus-visible:ring-0 aria-invalid:border-destructive aria-invalid:ring-0 disabled:bg-transparent md:text-sm dark:bg-transparent dark:disabled:bg-transparent dark:aria-invalid:ring-0"
        />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </form>
    )
  }

  return (
    <div onClick={handleClick} className={cn(UNDERLINE, 'group/inline flex cursor-text items-start gap-2')}>
      <span className="min-w-0 flex-1 wrap-break-word">
        {display ?? (value || <span className="text-muted-foreground">—</span>)}
      </span>
      {copyable && value && (
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={`Copy ${label.toLowerCase()}`}
          className={cn(
            PENCIL,
            'mt-0.5 rounded-sm outline-none hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring',
            copied && 'text-success opacity-100',
          )}
        >
          {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
        </button>
      )}
      <button
        type="button"
        onClick={start}
        aria-label={`Edit ${label.toLowerCase()}`}
        className={cn(PENCIL, 'mt-0.5 rounded-sm outline-none hover:text-foreground focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring')}
      >
        <PencilIcon className="size-3.5" />
      </button>
    </div>
  )
}
