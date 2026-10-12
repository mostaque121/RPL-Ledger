import { useEffect } from 'react'
import { toast } from 'sonner'

const OFFLINE = 'connection-offline'

/** Says when the connection drops (saving won't work) and when it's back (data refreshes on its own). */
export function useConnectionToasts() {
  useEffect(() => {
    function offline() {
      toast.warning("You're offline", {
        id: OFFLINE,
        description: "Changes can't be saved until the connection is back.",
        duration: Infinity,
      })
    }
    function online() {
      toast.dismiss(OFFLINE)
      toast.success('Back online')
    }
    if (!navigator.onLine) offline()
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => {
      window.removeEventListener('offline', offline)
      window.removeEventListener('online', online)
    }
  }, [])
}
