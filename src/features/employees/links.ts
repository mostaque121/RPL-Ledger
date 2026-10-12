import type { Period } from './stats'

/** An employee's own page, optionally opened on a month (or `all`). */
export const employeeHref = (employeeId: string, period?: Period) =>
  `/employees/${employeeId}${period ? `?month=${period}` : ''}`
