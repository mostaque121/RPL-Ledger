import { FileWarningIcon, Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PdfFrameProps {
  /** A `blob:` URL, or null while there's nothing to show yet. */
  url: string | null
  loading?: boolean
  error?: string | null
  title: string
  /** Show the browser's PDF toolbar (zoom, print). */
  toolbar?: boolean
  className?: string
}

/**
 * The browser's own PDF viewer in an iframe. Phones usually can't show PDFs inline,
 * so pages using this also offer "Open" / "Download".
 */
export function PdfFrame({ url, loading, error, title, toolbar = false, className }: PdfFrameProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg border bg-muted', className)}>
      {url && (
        <iframe
          key={url}
          src={`${url}#toolbar=${toolbar ? 1 : 0}&navpanes=0&view=FitH`}
          title={title}
          className="size-full"
        />
      )}

      {error ? (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-sm">
          <div className="space-y-2">
            <FileWarningIcon className="mx-auto size-6 text-danger" />
            <p className="font-semibold">The PDF couldn't be shown.</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : (
        loading && (
          <div
            className={cn(
              'absolute flex items-center gap-2 text-xs font-semibold text-muted-foreground',
              url ? 'top-2 right-2 rounded-full bg-card px-2.5 py-1 shadow ring-1 ring-foreground/10' : 'inset-0 justify-center',
            )}
          >
            <Loader2Icon className="size-3.5 animate-spin" />
            {url ? 'Updating…' : 'Preparing PDF…'}
          </div>
        )
      )}
    </div>
  )
}
