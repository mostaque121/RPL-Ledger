import { useState } from 'react'
import { DownloadIcon, EllipsisIcon, ExternalLinkIcon, FilePenLineIcon, MailIcon, PhoneIcon, Trash2Icon } from 'lucide-react'
import { Link } from 'react-router'
import { saleHref } from '@/features/sales/links'
import { Amount } from '@/components/data/Amount'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { StatusBadge } from '@/components/feedback/StatusBadge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { pdfFileName, useDeleteInvoiceMutation, useInvoicePdfQuery, type Invoice, type InvoiceVersion } from '../api/invoices'
import { invoiceStatus } from '../filters'
import { useObjectUrl } from '../hooks/use-object-url'
import { InvoiceStatusBadge, VersionBadge } from './InvoiceStatusBadge'
import { InvoiceTotalsList } from './InvoiceTotalsList'
import { PdfFrame } from './PdfFrame'

interface InvoiceDrawerProps {
  /** Null closes the drawer. */
  invoice: Invoice | null
  today: string
  onClose: () => void
  onUpdate: (invoice: Invoice) => void
}

export function InvoiceDrawer({ invoice, today, onClose, onUpdate }: InvoiceDrawerProps) {
  return (
    <Sheet open={invoice !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full gap-0 overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-4xl">
        {invoice && (
          // A new version re-mounts the detail, so it opens on the newest one.
          <InvoiceDetail
            key={`${invoice.id}:${invoice.latest.version}`}
            invoice={invoice}
            today={today}
            onClose={onClose}
            onUpdate={onUpdate}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}

function InvoiceDetail({ invoice, today, onClose, onUpdate }: Omit<InvoiceDrawerProps, 'invoice'> & { invoice: Invoice }) {
  const [selected, setSelected] = useState(invoice.latest.version)
  const [deleting, setDeleting] = useState(false)
  const remove = useDeleteInvoiceMutation()
  const version = invoice.versions.find((v) => v.version === selected) ?? invoice.latest
  const isLatest = version.version === invoice.latest.version
  const pdf = useInvoicePdfQuery(version.pdfPath)
  const url = useObjectUrl(pdf.data)
  const fileName = pdfFileName(invoice, version.version)

  return (
    <>
      <SheetHeader className="border-b pr-12">
        <div className="flex flex-wrap items-center gap-2">
          <SheetTitle className="money text-lg font-extrabold">{invoice.number}</SheetTitle>
          <InvoiceStatusBadge status={invoiceStatus(invoice, today)} />
          <VersionBadge version={invoice.latest.version} />
        </div>
        <SheetDescription>
          {invoice.latest.billToName}
          {invoice.saleId && (
            <>
              {' · '}
              <Link to={saleHref(invoice.saleId)} className="font-medium text-primary underline-offset-2 hover:underline">
                Open sale
              </Link>
            </>
          )}
        </SheetDescription>
        <ContactLine version={invoice.latest} />

        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" onClick={() => onUpdate(invoice)}>
            <FilePenLineIcon />
            Update invoice
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={url ?? undefined} download={fileName} aria-disabled={!url}>
              <DownloadIcon />
              Download
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={url ?? undefined} target="_blank" rel="noreferrer" aria-disabled={!url}>
              <ExternalLinkIcon />
              Open
            </a>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label="More actions">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(true)}>
                <Trash2Icon />
                Delete invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SheetHeader>

      <div className="grid gap-5 p-4 md:grid-cols-[15rem_minmax(0,1fr)]">
        <div className="space-y-5">
          <section className="space-y-2">
            <h3 className="text-sm font-bold">
              Versions <span className="text-xs font-medium text-muted-foreground">({invoice.versions.length})</span>
            </h3>
            <ol className="space-y-1.5">
              {[...invoice.versions].reverse().map((v) => (
                <li key={v.id}>
                  <VersionButton
                    version={v}
                    latest={v.version === invoice.latest.version}
                    active={v.version === version.version}
                    onClick={() => setSelected(v.version)}
                  />
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-2 rounded-lg border p-3">
            <p className="text-xs font-bold tracking-wide text-muted-foreground uppercase">
              {isLatest ? 'Current version' : `Version ${version.version}`}
            </p>
            <p className="text-xs text-muted-foreground">
              Dated {formatDate(version.issuedOn)} · due {formatDate(version.dueOn)}
            </p>
            <InvoiceTotalsList totals={version.totals} gstIncluded={version.gstIncluded} />
          </section>
        </div>

        <PdfFrame
          url={url}
          loading={pdf.isPending}
          error={pdf.isError ? errorMessage(pdf.error) : null}
          title={`${invoice.number} version ${version.version}`}
          toolbar
          className="aspect-[1/1.414] w-full"
        />
      </div>

      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete invoice ${invoice.number}?`}
        description={`All ${invoice.versions.length === 1 ? 'of it' : `${invoice.versions.length} versions`} and the saved PDFs will be removed. The number can then be used again. This can't be undone.`}
        confirmLabel="Delete"
        tone="danger"
        onConfirm={async () => {
          await remove.mutateAsync(invoice)
          onClose()
        }}
      />
    </>
  )
}

function VersionButton({ version, latest, active, onClick }: { version: InvoiceVersion; latest: boolean; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'w-full rounded-lg border px-3 py-2 text-left transition-colors hover:bg-muted',
        active && 'border-primary bg-accent hover:bg-accent',
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">Version {version.version}</span>
        {latest && <StatusBadge tone="primary">Current</StatusBadge>}
      </span>
      <span className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{formatDate(version.issuedOn)}</span>
        <span>
          Due <Amount cents={version.totals.due} className="font-semibold text-foreground" />
        </span>
      </span>
    </button>
  )
}

function ContactLine({ version }: { version: InvoiceVersion }) {
  if (!version.billToEmail && !version.billToPhone) return null
  return (
    <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {version.billToEmail && (
        <a href={`mailto:${version.billToEmail}`} className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline">
          <MailIcon className="size-3.5" />
          {version.billToEmail}
        </a>
      )}
      {version.billToPhone && (
        <a
          href={`tel:${version.billToPhone.replace(/\s/g, '')}`}
          className="inline-flex items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
        >
          <PhoneIcon className="size-3.5" />
          {version.billToPhone}
        </a>
      )}
    </p>
  )
}
