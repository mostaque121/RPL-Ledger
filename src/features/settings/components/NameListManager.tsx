import { useState } from 'react'
import { EllipsisIcon, PencilIcon, PlusIcon, PowerIcon, SearchIcon, Trash2Icon, type LucideIcon } from 'lucide-react'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { Segmented } from '@/components/forms/Segmented'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { NameListApi, NamedItem } from '../api/name-list'
import { NameDialog } from './NameDialog'
import { SettingsHeader } from './settings-ui'

/** Wording and icon for one list. */
export interface NameListCopy {
  icon: LucideIcon
  title: string
  /** Lower-case singular for buttons: "Add RTO", "Add course". */
  one: string
  description: string
  addHint: string
  placeholder: string
  emptyText: string
}

type Show = 'all' | 'active' | 'inactive'

interface NameListManagerProps {
  api: NameListApi
  items: NamedItem[]
  copy: NameListCopy
}

const NAME_WIDTHS = ['w-24', 'w-56', 'w-40', 'w-64', 'w-32', 'w-48'] as const

/** The list while it loads: header, search, and rows shaped like the real ones. */
export function NameListSkeleton({ copy }: { copy: NameListCopy }) {
  return (
    <div className="space-y-6" role="status" aria-label={`Loading ${copy.title.toLowerCase()}`}>
      <SettingsHeader icon={copy.icon} title={copy.title} description={copy.description}>
        <Button disabled>
          <PlusIcon />
          Add {copy.one}
        </Button>
      </SettingsHeader>
      <div className="space-y-3">
        <Skeleton className="h-8 rounded-lg" />
        <ul className="divide-y rounded-lg border" aria-hidden>
          {NAME_WIDTHS.map((w) => (
            <li key={w} className="flex items-center gap-3 px-4 py-2.5">
              <Skeleton className="size-8 shrink-0 rounded-md" />
              <div className="min-w-0 flex-1">
                <SkeletonText size="base" className={cn('max-w-full', w)} />
                <SkeletonText size="xs" className="w-14" />
              </div>
              <span className="size-7 shrink-0" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** A managed name list (RTOs, courses): add, rename, deactivate (hidden from new sales), delete when unused. */
export function NameListManager({ api, items, copy }: NameListManagerProps) {
  const [editing, setEditing] = useState<NamedItem | 'new' | null>(null)
  const [deleting, setDeleting] = useState<NamedItem | null>(null)
  const [search, setSearch] = useState('')
  const [show, setShow] = useState<Show>('all')
  const update = api.useUpdateMutation()
  const remove = api.useDeleteMutation()
  const Icon = copy.icon

  const activeCount = items.filter((i) => i.active).length
  const inactiveCount = items.length - activeCount
  const term = search.trim().toLowerCase()
  const shown = items.filter(
    (i) =>
      (show === 'all' || i.active === (show === 'active')) && (term === '' || i.name.toLowerCase().includes(term)),
  )

  const addButton = (
    <Button onClick={() => setEditing('new')}>
      <PlusIcon />
      Add {copy.one}
    </Button>
  )

  return (
    <div className="space-y-6">
      <SettingsHeader icon={Icon} title={copy.title} description={copy.description}>
        {addButton}
      </SettingsHeader>

      {items.length === 0 ? (
        <EmptyState icon={Icon} title={`No ${copy.title.toLowerCase()} yet`} description={copy.emptyText} action={addButton} />
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-48 flex-1">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${copy.title.toLowerCase()}`}
                aria-label={`Search ${copy.title.toLowerCase()}`}
                className="pl-8"
              />
            </div>
            {inactiveCount > 0 && (
              <Segmented
                aria-label={`Show ${copy.title.toLowerCase()}`}
                value={show}
                onChange={setShow}
                className="w-full sm:w-auto"
                options={[
                  { value: 'all', label: `All ${items.length}` },
                  { value: 'active', label: `Active ${activeCount}` },
                  { value: 'inactive', label: `Inactive ${inactiveCount}` },
                ]}
              />
            )}
          </div>

          {shown.length === 0 ? (
            <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
              Nothing matches{term ? ` "${search}"` : ''}.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {shown.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40">
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-md',
                      item.active ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
                    )}
                    aria-hidden
                  >
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn('truncate font-semibold', !item.active && 'text-muted-foreground line-through')}>
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.salesCount === 0 ? 'Not used yet' : `${item.salesCount} sale${item.salesCount === 1 ? '' : 's'}`}
                    </p>
                  </div>
                  {!item.active && <StatusBadge tone="muted">Inactive</StatusBadge>}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${item.name}`}>
                        <EllipsisIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(item)}>
                        <PencilIcon />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => update.mutate({ id: item.id, active: !item.active })}>
                        <PowerIcon />
                        {item.active ? 'Deactivate' : 'Reactivate'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={item.salesCount > 0}
                        onSelect={() => setDeleting(item)}
                      >
                        <Trash2Icon />
                        {item.salesCount > 0 ? 'Delete (used by sales)' : 'Delete'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {editing && (
        <NameDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          api={api}
          copy={copy}
          item={editing === 'new' ? undefined : editing}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? copy.one}?`}
        description="It isn't used by any sale, so nothing else changes."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={() => deleting && remove.mutateAsync(deleting.id)}
      />
    </div>
  )
}
