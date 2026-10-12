import { BuildingIcon, GraduationCapIcon } from 'lucide-react'
import type { NameListCopy } from './NameListManager'

export const RTO_COPY: NameListCopy = {
  icon: BuildingIcon,
  title: 'RTOs',
  one: 'RTO',
  description: "Inactive RTOs stay on old sales but can't be picked for new ones.",
  addHint: 'The registered training organisation that issues the certificate.',
  placeholder: 'e.g. ACMC',
  emptyText: 'Add the RTOs you sell certificates for.',
}

export const COURSE_COPY: NameListCopy = {
  icon: GraduationCapIcon,
  title: 'Courses',
  one: 'course',
  description: 'Sales pick from this list, so reports can show profit by course.',
  addHint: 'Use the full qualification name so reports group it correctly.',
  placeholder: 'e.g. Certificate III in Carpentry',
  emptyText: 'Add the qualifications you sell. You can also add them while entering a sale.',
}
