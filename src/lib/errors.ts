/**
 * Turns Supabase / Postgres errors into short messages Tanvir can act on.
 * Every API call goes through `unwrap`, so pages only ever see friendly `Error`s.
 */

export interface DbErrorLike {
  code?: string
  message: string
  details?: string | null
}

/** Per-call overrides keyed by Postgres error code, e.g. `{ '23505': 'That RTO already exists.' }`. */
export type ErrorMessages = Partial<Record<string, string>>

const DEFAULT_MESSAGES: Record<string, string> = {
  '23505': 'That already exists.',
  '23503': "It's used by other records, so it can't be removed.",
  '23514': 'That value is not allowed.',
  '42501': 'Not allowed. Try signing in again.',
  PGRST301: 'Your session has expired. Sign in again.',
  // Table missing from the API: the SQL in supabase/migrations/ hasn't been run on this project.
  PGRST205: 'The database is not set up yet. Run the SQL files in supabase/migrations/ in the Supabase SQL Editor.',
  // Relationship missing: a newer migration (e.g. a new foreign key) hasn't been run yet.
  PGRST200: 'The database is out of date. Run the newest SQL files in supabase/migrations/ in the Supabase SQL Editor.',
}

export function friendlyDbError(error: DbErrorLike, messages: ErrorMessages = {}): string {
  const code = error.code ?? ''
  const override = messages[code]
  if (override) return override
  // `raise exception` in our SQL functions/triggers: the message is already written for people.
  if (code === 'P0001') return error.message
  if (code in DEFAULT_MESSAGES) return DEFAULT_MESSAGES[code]
  if (/failed to fetch|network/i.test(error.message)) return "Can't reach the server. Check your connection."
  return error.message || 'Something went wrong.'
}

/** Return `data`, or throw a friendly `Error` when Supabase returned an error. */
export function unwrap<T>(
  result: { data: T; error: null } | { data: unknown; error: DbErrorLike },
  messages?: ErrorMessages,
): T {
  if (result.error) throw new Error(friendlyDbError(result.error, messages), { cause: result.error })
  return result.data as T
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.'
}
