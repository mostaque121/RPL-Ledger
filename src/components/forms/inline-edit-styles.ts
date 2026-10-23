import { cn } from '@/lib/utils'

/** HubSpot-style value: plain text, a faint underline on hover, the primary colour while editing. */
export const UNDERLINE =
  'border-0 border-b border-transparent py-1 transition-colors hover:border-foreground/25 focus-visible:border-primary'

/**
 * Makes a picker's trigger (Combobox, DatePicker) look like an inline value.
 * Pair with `InlineTriggerContent`.
 */
export const INLINE_TRIGGER = cn(
  UNDERLINE,
  'group/inline h-auto w-full items-start justify-between gap-2 rounded-none bg-transparent px-0 text-left text-sm font-medium whitespace-normal text-foreground shadow-none',
  'hover:bg-transparent focus-visible:ring-0 aria-expanded:border-primary aria-expanded:bg-transparent',
  'dark:border-transparent dark:bg-transparent dark:hover:bg-transparent dark:hover:border-foreground/25 dark:aria-expanded:border-primary [&_svg]:mt-0.5',
)
