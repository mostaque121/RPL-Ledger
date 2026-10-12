import { Tabs } from 'radix-ui'
import { UnderlineTabsList, UnderlineTabsTrigger } from '@/components/data/UnderlineTabs'
import { TASK_TABS, type TaskTab } from '../filters'

const LABEL: Record<TaskTab, string> = {
  open: 'Open',
  overdue: 'Overdue',
  today: 'Due today',
  soon: 'This week',
  done: 'Done',
  all: 'All',
}

interface TasksTabsProps {
  value: TaskTab
  onChange: (value: TaskTab) => void
  /** How many tasks each tab would show, with the other filters applied. Null while tasks load. */
  counts: Record<TaskTab, number> | null
}

/** Open tasks, open ones by urgency, done ones, or all. Same style as the Sales tabs. */
export function TasksTabs({ value, onChange, counts }: TasksTabsProps) {
  return (
    <Tabs.Root value={value} onValueChange={(v) => onChange(v as TaskTab)}>
      <UnderlineTabsList aria-label="Which tasks">
        {TASK_TABS.map((tab) => (
          <UnderlineTabsTrigger key={tab} value={tab} count={counts?.[tab]} countPending={!counts} showZero>
            {LABEL[tab]}
          </UnderlineTabsTrigger>
        ))}
      </UnderlineTabsList>
    </Tabs.Root>
  )
}
