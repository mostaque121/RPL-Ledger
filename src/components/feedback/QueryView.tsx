import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'

interface QueryViewProps<T> {
  query: UseQueryResult<T>
  /** Rendered when the data is an empty array. */
  empty?: ReactNode
  loadingRows?: number
  /** A placeholder shaped like the content (a skeleton); defaults to plain rows. */
  loading?: ReactNode
  children: (data: T) => ReactNode
}

/** Loading → error (with retry) → empty → content, the same way on every page. */
export function QueryView<T>({ query, empty, loadingRows, loading, children }: QueryViewProps<T>) {
  if (query.isPending) return <>{loading ?? <LoadingState rows={loadingRows} />}</>
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  if (empty && Array.isArray(query.data) && query.data.length === 0) return <>{empty}</>
  return <>{children(query.data)}</>
}
