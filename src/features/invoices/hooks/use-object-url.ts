import { useEffect, useState } from 'react'

/** A `blob:` URL for a Blob (for an iframe or a download link), revoked when it's no longer used. */
export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    const next = blob ? URL.createObjectURL(blob) : null
    // Object URLs are an external resource: created here and revoked in the cleanup,
    // which also keeps StrictMode's double effect run from using a revoked URL.
    // oxlint-disable-next-line react/set-state-in-effect
    setUrl(next)
    return () => {
      if (next) URL.revokeObjectURL(next)
    }
  }, [blob])
  return url
}
