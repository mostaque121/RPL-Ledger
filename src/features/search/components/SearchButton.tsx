import { useEffect, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { isMac, isTyping } from '@/lib/keyboard'
import { CommandPalette } from './CommandPalette'

const SEARCH_SHORTCUT = isMac ? '⌘ K' : 'Ctrl K'

/** The top bar's search icon. Opens the command box; so do Ctrl / ⌘ + K anywhere and "/" outside a field. */
export function SearchButton() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Search" aria-keyshortcuts="Control+K Meta+K" onClick={() => setOpen(true)}>
            <SearchIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Search · {SEARCH_SHORTCUT}</TooltipContent>
      </Tooltip>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  )
}
