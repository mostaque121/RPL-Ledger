import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import { errorMessage } from '@/lib/errors'

interface AppMutationOptions<TVars, TData> {
  mutationFn: (vars: TVars) => Promise<TData>
  /** Query keys to refetch after success (prefix match). */
  invalidate?: QueryKey[]
  /** Toast shown on success. A function gets the result and variables. */
  success?: string | ((data: TData, vars: TVars) => string)
  /** Show the error as a toast (default). Turn off when the form shows it inline. */
  toastError?: boolean
}

/**
 * The one mutation pattern used by every feature's `api`:
 * run, refetch what changed, toast the result. Errors arrive already friendly (see `unwrap`).
 */
export function useAppMutation<TVars = void, TData = unknown>({
  mutationFn,
  invalidate = [],
  success,
  toastError = true,
}: AppMutationOptions<TVars, TData>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: async (data, vars) => {
      await Promise.all(invalidate.map((queryKey) => queryClient.invalidateQueries({ queryKey })))
      if (success) toast.success(typeof success === 'function' ? success(data, vars) : success)
    },
    onError: (error) => {
      if (toastError) toast.error(errorMessage(error))
    },
  })
}
