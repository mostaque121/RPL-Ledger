import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react'
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon, PlusIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface ComboboxOption {
  value: string
  label: string
  /** Options with the same group are listed under one heading, in the order given. */
  group?: string
  /** Small text on the right, e.g. "Partner". */
  hint?: string
}

interface ComboboxProps {
  id?: string
  value: string | null
  onChange: (value: string | null) => void
  options: readonly ComboboxOption[]
  placeholder?: string
  searchPlaceholder?: string
  /** Shows "Add “text”" when the search has no exact match. Resolve with the new option's value. */
  onCreate?: (text: string) => Promise<string>
  /** Shows a "None" row that clears the value. */
  clearable?: boolean
  disabled?: boolean
  invalid?: boolean
  className?: string
  /** Replaces the trigger's text and chevron, e.g. an icon-only "pick" button. */
  trigger?: ReactNode
  /** Extra classes for the dropdown, e.g. a fixed width when the trigger is small. */
  contentClassName?: string
  'aria-label'?: string
}

type Row = { kind: 'option'; option: ComboboxOption } | { kind: 'clear' } | { kind: 'create'; text: string }

/** Searchable select: type to filter, ↑ ↓ to move, Enter to pick. Can add a new item inline. */
export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  onCreate,
  clearable,
  disabled,
  invalid,
  className,
  trigger,
  contentClassName,
  'aria-label': ariaLabel,
}: ComboboxProps) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [creating, setCreating] = useState(false)

  const selected = options.find((o) => o.value === value)
  const text = query.trim()

  const rows = useMemo<Row[]>(() => {
    const needle = text.toLowerCase()
    const matches = options.filter((o) => o.label.toLowerCase().includes(needle))
    const out: Row[] = []
    if (clearable && !needle) out.push({ kind: 'clear' })
    out.push(...matches.map((option) => ({ kind: 'option' as const, option })))
    const exact = options.some((o) => o.label.toLowerCase() === needle)
    if (onCreate && needle && !exact) out.push({ kind: 'create', text })
    return out
  }, [options, text, clearable, onCreate])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setQuery('')
      setActive(Math.max(0, options.findIndex((o) => o.value === value) + (clearable ? 1 : 0)))
    }
  }

  async function choose(row: Row) {
    if (row.kind === 'clear') onChange(null)
    else if (row.kind === 'option') onChange(row.option.value)
    else {
      setCreating(true)
      try {
        onChange(await onCreate!(row.text))
      } catch {
        return // the mutation already showed the error; keep the list open
      } finally {
        setCreating(false)
      }
    }
    setOpen(false)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (rows.length ? (i + step + rows.length) % rows.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const row = rows[Math.min(active, rows.length - 1)]
      if (row && !creating) void choose(row)
    }
  }

  return (
    // Modal, so the list can scroll when the picker sits inside a dialog.
    <Popover modal open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={invalid}
          aria-label={ariaLabel}
          disabled={disabled}
          className={cn('w-full justify-between font-normal', !selected && 'text-muted-foreground', className)}
        >
          {trigger ?? (
            <>
              <span className="truncate">{selected?.label ?? placeholder}</span>
              <ChevronsUpDownIcon className="text-muted-foreground" />
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn('w-(--radix-popover-trigger-width) min-w-56 gap-0 p-0', contentClassName)} align="start">
        <div className="flex items-center gap-2 border-b px-3">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder={searchPlaceholder}
            aria-controls={listId}
            className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul id={listId} role="listbox" className="max-h-64 overflow-y-auto p-1">
          {rows.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted-foreground">No matches</li>}
          {rows.map((row, i) => {
            const group = row.kind === 'option' ? row.option.group : undefined
            const prev = rows[i - 1]
            const showGroup = group && (prev?.kind !== 'option' || prev.option.group !== group)
            return (
              <li key={row.kind === 'option' ? row.option.value : row.kind} role="presentation">
                {showGroup && (
                  <p className="px-2 pt-2 pb-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    {group}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={row.kind === 'option' && row.option.value === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => void choose(row)}
                  disabled={creating}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                    i === active && 'bg-accent text-accent-foreground',
                  )}
                >
                  {row.kind === 'option' && (
                    <>
                      <CheckIcon className={cn('size-4', row.option.value === value ? 'text-primary' : 'invisible')} />
                      <span className="flex-1 truncate">{row.option.label}</span>
                      {row.option.hint && <span className="text-xs text-muted-foreground">{row.option.hint}</span>}
                    </>
                  )}
                  {row.kind === 'clear' && <span className="pl-6 text-muted-foreground italic">None</span>}
                  {row.kind === 'create' && (
                    <>
                      {creating ? <Loader2Icon className="size-4 animate-spin" /> : <PlusIcon className="size-4 text-primary" />}
                      <span className="truncate">
                        Add <span className="font-semibold">“{row.text}”</span>
                      </span>
                    </>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
