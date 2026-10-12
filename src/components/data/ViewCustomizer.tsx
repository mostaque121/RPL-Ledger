import { useState } from 'react'
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVerticalIcon, LockIcon, RotateCcwIcon, Settings2Icon } from 'lucide-react'
import { Segmented } from '@/components/forms/Segmented'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { defaultItems, moveItem, toggleItem, type ViewItem, type ViewItemDef } from '@/lib/view-prefs'

export interface CustomizerSection {
  key: string
  label: string
  defs: readonly ViewItemDef[]
  items: readonly ViewItem[]
  // Method syntax so a section of specific ids (e.g. column ids) fits.
  onChange(items: ViewItem[]): void
  onReset(): void
}

function Row({ item, def, onToggle }: { item: ViewItem; def: ViewItemDef; onToggle: (visible: boolean) => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const checkboxId = `view-item-${def.id}`

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        'relative flex items-center gap-2 rounded-lg bg-popover py-1 pr-2.5 pl-1 transition-colors hover:bg-muted/60',
        isDragging && 'z-10 bg-card shadow-lg ring-1 ring-primary/30',
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={`Move ${def.label}`}
        className="grid size-7 shrink-0 cursor-grab touch-none place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon className="size-4" />
      </button>
      <Checkbox
        id={checkboxId}
        checked={item.visible}
        disabled={def.required}
        onCheckedChange={(checked) => onToggle(checked === true)}
      />
      <label
        htmlFor={checkboxId}
        className={cn('flex-1 cursor-pointer py-1 text-sm select-none', !item.visible && 'text-muted-foreground')}
      >
        {def.label}
      </label>
      {def.required && (
        <span title="Always shown" className="text-muted-foreground">
          <LockIcon className="size-3.5" />
          <span className="sr-only">Always shown</span>
        </span>
      )}
    </li>
  )
}

function SortableItems({ section }: { section: CustomizerSection }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const defs = new Map(section.defs.map((d) => [d.id, d]))

  function onDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) section.onChange(moveItem(section.items, String(active.id), String(over.id)))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={onDragEnd}>
      <SortableContext items={section.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="relative space-y-0.5">
          {section.items.map((item) => {
            const def = defs.get(item.id)
            return (
              def && (
                <Row key={item.id} item={item} def={def} onToggle={(v) => section.onChange(toggleItem(section.items, section.defs, item.id, v))} />
              )
            )
          })}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

const isDefault = (s: CustomizerSection) => JSON.stringify(s.items) === JSON.stringify(defaultItems(s.defs))

/**
 * "Customize" button for a list page: choose which columns / filters show and drag them into order.
 * Choices are saved in this browser by the owner (see `useViewItems`).
 */
interface ViewCustomizerProps {
  sections: CustomizerSection[]
  /** Optional control from outside, e.g. a pencil next to the filters opening the "Filters" tab. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  tab?: string
  onTabChange?: (tab: string) => void
}

export function ViewCustomizer({ sections, open, onOpenChange, tab: tabProp, onTabChange }: ViewCustomizerProps) {
  const [ownTab, setOwnTab] = useState(sections[0]?.key ?? '')
  const tab = tabProp ?? ownTab
  const setTab = onTabChange ?? setOwnTab
  const section = sections.find((s) => s.key === tab) ?? sections[0]
  if (!section) return null
  const shown = section.items.filter((i) => i.visible).length

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Settings2Icon />
          <span className="hidden sm:inline">Customize</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={12}
        // Fit the space Radix measures next to the button; only the list in the middle scrolls.
        className="flex max-h-[min(36rem,var(--radix-popover-content-available-height))] w-80 flex-col gap-0 overflow-hidden p-0"
      >
        <div className="shrink-0 space-y-3 border-b p-3">
          <div>
            <p className="text-sm font-bold">Customize view</p>
            <p className="text-xs text-muted-foreground">Tick what to show. Drag ⠿ to change the order.</p>
          </div>
          {sections.length > 1 && (
            <Segmented
              aria-label="What to customize"
              value={section.key}
              onChange={setTab}
              options={sections.map((s) => ({ value: s.key, label: s.label }))}
            />
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 scrollbar-slim">
          <SortableItems key={section.key} section={section} />
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {shown} of {section.items.length} shown
          </span>
          <Button variant="ghost" size="sm" disabled={isDefault(section)} onClick={section.onReset}>
            <RotateCcwIcon />
            Reset
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
