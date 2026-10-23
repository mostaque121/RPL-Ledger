import { useMemo } from 'react'
import type { ComboboxOption } from '@/components/forms/Combobox'
import { usePeopleQuery } from '@/features/employees/api'
import { useCoursesQuery } from '@/features/settings/api/courses'
import { useRtosQuery } from '@/features/settings/api/rtos'

/** Active items, plus the one the sale already uses (so an inactive pick still shows). */
const pickable = <T extends { id: string; active: boolean }>(items: T[] | undefined, keep: string | null | undefined) =>
  (items ?? []).filter((i) => i.active || i.id === keep)

/** The seller, course and RTO pickers' options, shared by the sale form and the sale page. */
export function useSaleOptions(sale?: { sellerId: string; courseId: string | null; rtoId: string | null }) {
  const people = usePeopleQuery()
  const rtos = useRtosQuery()
  const courses = useCoursesQuery()

  const sellerOptions = useMemo<ComboboxOption[]>(
    () =>
      pickable(people.data, sale?.sellerId).map((p) => ({
        value: p.id,
        label: p.name,
        group: p.role === 'partner' ? 'Partners' : 'Employees',
        hint: p.role === 'partner' ? 'Own sale' : '60/40',
      })),
    [people.data, sale?.sellerId],
  )
  const courseOptions = useMemo<ComboboxOption[]>(
    () => pickable(courses.data, sale?.courseId).map((c) => ({ value: c.id, label: c.name })),
    [courses.data, sale?.courseId],
  )
  const rtoOptions = useMemo<ComboboxOption[]>(
    () => pickable(rtos.data, sale?.rtoId).map((r) => ({ value: r.id, label: r.name })),
    [rtos.data, sale?.rtoId],
  )

  return { people, sellerOptions, courseOptions, rtoOptions }
}
