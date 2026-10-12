import { QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from './errors'

export const queryClient = new QueryClient({
  // A first load that fails shows its error in the page. A refresh that fails keeps the data on
  // screen, so say so here, once (same toast id), instead of failing silently.
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.state.data !== undefined) {
        toast.error(`Couldn't refresh the latest data. ${errorMessage(error)}`, { id: 'refresh-error' })
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
