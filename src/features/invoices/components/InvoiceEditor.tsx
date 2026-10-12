import { useMemo, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckIcon, EyeIcon, FileDownIcon, Link2Icon, Loader2Icon, PencilIcon, RotateCcwIcon, SparklesIcon } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useBlocker } from 'react-router'
import { toast } from 'sonner'
import logoUrl from '@/assets/invoice-logo.png'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { FormModalBody, FormModalFooter, FormModalHeader } from '@/components/layout/FormModal'
import { Combobox, type ComboboxOption } from '@/components/forms/Combobox'
import { DatePicker } from '@/components/forms/DatePicker'
import { MoneyInput } from '@/components/forms/MoneyInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { SaleView } from '@/features/sales/api/sales'
import { useCoursesQuery } from '@/features/settings/api/courses'
import { invoiceTotals } from '@/lib/accounting'
import { errorMessage } from '@/lib/errors'
import { formatDate, formatDollars, todayInSydney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useSaveInvoiceMutation, type Invoice } from '../api/invoices'
import { issuerOf, type InvoiceProfile } from '../api/profile'
import { blankDraft, dueDate, nextVersionDraft, previewDocument, saleFields, saleSourceOf } from '../draft'
import { isNumberTaken, nextInvoiceNumber } from '../numbering'
import { invoiceSchema, type InvoiceValues } from '../schema'
import { IssuerFields } from './form/IssuerFields'
import { ItemsField } from './form/ItemsField'
import { LINE_INPUT, META_INPUT, MetaRow, SectionLabel } from './form/paper'

export type InvoiceEditorMode =
  | { kind: 'new'; saleId?: string | null }
  /** Same number, next version. */
  | { kind: 'version'; invoice: Invoice }

interface InvoiceEditorProps {
  mode: InvoiceEditorMode
  /** Called with the invoice id after saving. */
  onSaved: (id: string) => void
  invoices: Invoice[]
  profile: InvoiceProfile
  sales: SaleView[]
}

function initialValues(mode: InvoiceEditorMode, invoices: Invoice[], profile: InvoiceProfile, sales: SaleView[]) {
  const today = todayInSydney()
  if (mode.kind === 'version') {
    const sale = sales.find((s) => s.id === mode.invoice.saleId)
    return nextVersionDraft(mode.invoice, profile, today, sale && saleSourceOf(sale))
  }
  const number = nextInvoiceNumber(
    invoices.map((i) => i.number),
    profile.numberPrefix,
    profile.firstNumber,
  )
  const draft = blankDraft(profile, number, today)
  const sale = mode.saleId ? sales.find((s) => s.id === mode.saleId) : undefined
  return sale ? { ...draft, ...saleFields(saleSourceOf(sale)) } : draft
}

const safeInt = (n: number | null | undefined) => (Number.isInteger(n) ? (n as number) : 0)

const BANK_FIELDS = [
  { name: 'issuer.bankAccountName', label: 'Account name', mono: false },
  { name: 'issuer.bankBsb', label: 'BSB', mono: true },
  { name: 'issuer.bankAccountNumber', label: 'Account number', mono: true },
] as const

/** Header / form width inside the full-page modal. */
const WIDTH = '58rem'

/**
 * The invoice form, laid out like the invoice itself, for inside a `FormModal`.
 * Nothing is saved until the PDF is generated.
 */
export function InvoiceEditor({ mode, onSaved, invoices, profile, sales }: InvoiceEditorProps) {
  const [initial] = useState(() => initialValues(mode, invoices, profile, sales))
  const [editCompany, setEditCompany] = useState(false)
  const [numberFilled, setNumberFilled] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const today = initial.issuedOn
  const save = useSaveInvoiceMutation()
  const courses = useCoursesQuery()
  const isVersion = mode.kind === 'version'
  const nextVersion = isVersion ? mode.invoice.latest.version + 1 : 1

  const form = useForm<InvoiceValues>({ resolver: zodResolver(invoiceSchema), defaultValues: initial })
  const { errors } = form.formState
  const values = useWatch({ control: form.control }) as InvoiceValues
  const { isDirty } = form.formState

  // Closing the modal is a navigation (✕, Escape and Back all go through the URL), so one
  // blocker asks before any of them throws away unsaved changes. Saving navigates on purpose.
  const saved = useRef(false)
  // Set when "Leave" is chosen: the confirm dialog then closes itself, and that close must not
  // cancel (reset) the navigation that was just let through.
  const leaving = useRef(false)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !saved.current &&
      (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
  )

  const numbers = useMemo(() => invoices.map((i) => i.number), [invoices])
  const suggested = nextInvoiceNumber(numbers, profile.numberPrefix, profile.firstNumber)
  const invoicesBySale = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const inv of invoices) if (inv.saleId) map.set(inv.saleId, [...(map.get(inv.saleId) ?? []), inv.number])
    return map
  }, [invoices])
  const saleOptions = useMemo<ComboboxOption[]>(
    () =>
      sales.map((s) => ({
        value: s.id,
        label: `${s.clientName} · ${s.courseName ?? 'No course'}`,
        hint: invoicesBySale.get(s.id)?.join(', ') ?? formatDate(s.saleDate),
      })),
    [sales, invoicesBySale],
  )
  const courseNames = useMemo(() => (courses.data ?? []).filter((c) => c.active).map((c) => c.name), [courses.data])

  const linkedSale = sales.find((s) => s.id === values.saleId)
  const salePaid = linkedSale ? Math.max(0, linkedSale.summary.collected) : null
  const totals = invoiceTotals(
    (values.items ?? []).map((i) => ({ quantity: safeInt(i?.quantity), unitPrice: safeInt(i?.unitPrice) })),
    safeInt(values.amountPaid),
    !!values.gstIncluded,
  )
  const issuer = values.issuer
  const busy = save.isPending || previewing

  function linkSale(id: string | null) {
    form.setValue('saleId', id ?? '', { shouldDirty: true })
    const sale = id ? sales.find((s) => s.id === id) : undefined
    if (!sale) return
    const fields = saleFields(saleSourceOf(sale))
    form.setValue('billToName', fields.billToName, { shouldDirty: true })
    form.setValue('billToEmail', fields.billToEmail, { shouldDirty: true })
    form.setValue('billToPhone', fields.billToPhone, { shouldDirty: true })
    form.setValue('items', fields.items, { shouldDirty: true })
    form.setValue('amountPaid', fields.amountPaid, { shouldDirty: true })
    form.clearErrors()
  }

  function fillNumber() {
    form.setValue('number', suggested, { shouldDirty: true, shouldValidate: true })
    setNumberFilled(true)
    setTimeout(() => setNumberFilled(false), 1200)
  }

  /**
   * Opens the PDF in a new tab. The tab is opened right away (browsers block pop-ups opened after
   * an `await`), shows "Preparing…", then loads the PDF once it's rendered.
   */
  async function openPreview() {
    const tab = window.open('', '_blank')
    if (!tab) {
      toast.error('Allow pop-ups for this site to preview the PDF.')
      return
    }
    tab.document.title = 'Preparing preview…'
    tab.document.body.style.cssText = 'margin:0;display:grid;place-items:center;height:100vh;font:14px system-ui;color:#666'
    tab.document.body.textContent = 'Preparing preview…'
    setPreviewing(true)
    try {
      const { renderInvoicePdf } = await import('../pdf/render')
      const blob = await renderInvoicePdf(previewDocument(form.getValues(), today))
      const url = URL.createObjectURL(blob)
      tab.location.href = url
      // The tab has loaded it by then; free the memory.
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      tab.close()
      toast.error(`The preview couldn't be made: ${errorMessage(e)}`)
    } finally {
      setPreviewing(false)
    }
  }

  function submit(v: InvoiceValues) {
    if (!isVersion && isNumberTaken(v.number, numbers)) {
      form.setError('number', { message: `${v.number.trim()} is already used` })
      return
    }
    save.mutate(
      { invoice: isVersion ? mode.invoice : undefined, values: v },
      {
        onSuccess: (r) => {
          saved.current = true
          onSaved(r.id)
        },
      },
    )
  }

  // `saved` is only read in the save callback and the leave-page check, never while rendering.
  // oxlint-disable-next-line react/refs
  const onSubmit = form.handleSubmit(submit)

  const actions = (
    <>
      <Button variant="outline" onClick={openPreview} disabled={busy}>
        {previewing ? <Loader2Icon className="animate-spin" /> : <EyeIcon />}
        Preview
      </Button>
      <Button type="submit" form="invoice-form" disabled={busy} className="font-bold">
        {save.isPending ? <Loader2Icon className="animate-spin" /> : <FileDownIcon />}
        {save.isPending ? 'Generating…' : isVersion ? `Generate v${nextVersion}` : 'Generate PDF'}
      </Button>
    </>
  )

  return (
    <>
      <FormModalHeader
        eyebrow={isVersion ? `Version ${nextVersion} · same number` : 'New document'}
        title={isVersion ? `Update ${mode.invoice.number}` : 'Create invoice'}
        actions={actions}
        maxWidth={WIDTH}
      />

      <FormModalBody maxWidth={WIDTH}>
        <p className="mb-5 text-xs text-muted-foreground">
          {isVersion
            ? `Version ${nextVersion - 1} stays saved. Nothing changes until you generate the PDF.`
            : 'Nothing is saved until you generate the PDF.'}
        </p>
        <form id="invoice-form" onSubmit={onSubmit} noValidate className="space-y-6">
          {/* ── Fill from a sale ─────────────────────────────────── */}
          <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
            <span className="flex items-center gap-2.5 text-sm font-semibold sm:w-44 sm:shrink-0">
              <span className="grid size-8 place-items-center rounded-full bg-accent text-accent-foreground">
                <Link2Icon className="size-4" />
              </span>
              Fill from a sale
            </span>
            <Combobox
              id="inv-sale"
              value={values.saleId || null}
              onChange={linkSale}
              options={saleOptions}
              placeholder="Not linked — pick a sale to fill in the client and course"
              searchPlaceholder="Search client or course…"
              clearable
              className="flex-1"
            />
          </div>

          {/* ── The invoice ──────────────────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.12)]">
            {/* Letterhead */}
            <div className="flex flex-col gap-6 px-6 pt-8 pb-7 sm:flex-row sm:items-start sm:justify-between sm:px-10">
              <div className="w-fit rounded-xl bg-white p-2.5 ring-1 ring-foreground/5">
                <img src={logoUrl} alt={issuer?.companyName} className="h-14 w-auto" />
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="text-3xl font-extrabold tracking-[0.28em] text-foreground/90">INVOICE</p>
                <div className="h-0.5 w-10 rounded-full bg-success sm:ml-auto" />
                <p className="pt-2 text-sm font-bold text-success">{issuer?.companyName}</p>
                <p className="text-xs leading-relaxed whitespace-pre-line text-muted-foreground">
                  {[issuer?.address, issuer?.phone && `Mobile: ${issuer.phone}`, issuer?.website, issuer?.abn && `ABN: ${issuer.abn}`]
                    .filter(Boolean)
                    .join('\n')}
                </p>
                <button
                  type="button"
                  onClick={() => setEditCompany((v) => !v)}
                  className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-accent sm:-mr-2"
                >
                  <PencilIcon className="size-3" />
                  {editCompany ? 'Done' : 'Edit company details'}
                </button>
              </div>
            </div>

            {(editCompany || errors.issuer) && (
              <div className="mx-6 mb-7 space-y-4 rounded-xl border bg-muted/40 p-5 sm:mx-10">
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel>Company details for this invoice</SectionLabel>
                  <button
                    type="button"
                    onClick={() => form.setValue('issuer', issuerOf(profile), { shouldDirty: true, shouldValidate: true })}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <RotateCcwIcon className="size-3" />
                    Use Settings
                  </button>
                </div>
                <IssuerFields idPrefix="inv-issuer" register={(name) => form.register(`issuer.${name}`)} errors={errors.issuer} part="company" />
              </div>
            )}

            {/* Perforation */}
            <div className="relative mx-0 border-t-2 border-dashed">
              <span className="absolute -top-3 -left-3 size-6 rounded-full border bg-background" />
              <span className="absolute -top-3 -right-3 size-6 rounded-full border bg-background" />
            </div>

            <div className="space-y-10 px-6 py-8 sm:px-10 sm:py-10">
              {/* Bill to + meta */}
              <div className="grid gap-10 sm:grid-cols-2 sm:gap-12">
                <div className="space-y-4">
                  <SectionLabel>Bill to</SectionLabel>
                  <div className="space-y-1">
                    <Input
                      aria-label="Client name"
                      placeholder="Client full name"
                      autoComplete="off"
                      aria-invalid={!!errors.billToName}
                      className={cn(LINE_INPUT, 'h-10 text-base font-bold')}
                      {...form.register('billToName')}
                    />
                    {errors.billToName && <p className="text-xs font-medium text-danger">{errors.billToName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Input
                      aria-label="Client email"
                      type="email"
                      placeholder="client@email.com"
                      autoComplete="off"
                      aria-invalid={!!errors.billToEmail}
                      className={cn(LINE_INPUT, 'text-muted-foreground focus-visible:text-foreground')}
                      {...form.register('billToEmail')}
                    />
                    {errors.billToEmail && <p className="text-xs font-medium text-danger">{errors.billToEmail.message}</p>}
                  </div>
                  <Input
                    aria-label="Client phone"
                    type="tel"
                    placeholder="Phone (optional)"
                    autoComplete="off"
                    className={cn(LINE_INPUT, 'text-muted-foreground focus-visible:text-foreground')}
                    {...form.register('billToPhone')}
                  />
                </div>

                <div>
                  <MetaRow label="Invoice number" htmlFor="inv-number" error={errors.number?.message}>
                    <Input
                      id="inv-number"
                      autoComplete="off"
                      readOnly={isVersion}
                      aria-invalid={!!errors.number}
                      className={cn(META_INPUT, 'money w-32 font-bold', isVersion && 'cursor-not-allowed text-muted-foreground hover:bg-transparent')}
                      {...form.register('number')}
                    />
                    {!isVersion && (
                      <button
                        type="button"
                        onClick={fillNumber}
                        title={`Next number: ${suggested}`}
                        aria-label={`Use the next number, ${suggested}`}
                        className={cn(
                          'grid size-7 place-items-center rounded-md transition-all',
                          numberFilled
                            ? 'scale-105 bg-success/15 text-success ring-2 ring-success/30'
                            : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        {numberFilled ? <CheckIcon className="size-3.5" /> : <SparklesIcon className="size-3.5" />}
                      </button>
                    )}
                  </MetaRow>
                  <MetaRow label="Invoice date" htmlFor="inv-issued" error={errors.issuedOn?.message}>
                    <Controller
                      control={form.control}
                      name="issuedOn"
                      render={({ field }) => (
                        <DatePicker
                          id="inv-issued"
                          value={field.value || null}
                          onChange={(d) => {
                            field.onChange(d ?? '')
                            if (d) form.setValue('dueOn', dueDate(d, profile.paymentTermsDays), { shouldValidate: true })
                          }}
                          invalid={!!errors.issuedOn}
                          className={cn(META_INPUT, 'w-auto justify-end')}
                        />
                      )}
                    />
                  </MetaRow>
                  <MetaRow label="Payment due" htmlFor="inv-due" error={errors.dueOn?.message}>
                    <Controller
                      control={form.control}
                      name="dueOn"
                      render={({ field }) => (
                        <DatePicker
                          id="inv-due"
                          value={field.value || null}
                          onChange={(d) => field.onChange(d ?? '')}
                          invalid={!!errors.dueOn}
                          className={cn(META_INPUT, 'w-auto justify-end')}
                        />
                      )}
                    />
                  </MetaRow>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-success/10 px-4 py-3 ring-1 ring-success/25">
                    <span className="text-xs font-bold text-success">Amount due (AUD)</span>
                    <span className="money text-lg font-extrabold text-success">{formatDollars(totals.due)}</span>
                  </div>
                </div>
              </div>

              {/* Items */}
              <ItemsField form={form} courseNames={courseNames} />

              {/* Totals */}
              <div className="ml-auto w-full space-y-1 text-sm sm:w-80">
                <div className="flex items-center justify-between border-b py-2.5">
                  <span className="text-muted-foreground">Total</span>
                  <span className="money font-bold">{formatDollars(totals.total)}</span>
                </div>
                <div className="border-b py-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="inv-paid" className="text-muted-foreground">
                      Amount paid
                    </label>
                    <Controller
                      control={form.control}
                      name="amountPaid"
                      render={({ field }) => (
                        <MoneyInput
                          id="inv-paid"
                          symbol="$"
                          placeholder="0.00"
                          value={field.value ?? null}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          aria-invalid={!!errors.amountPaid}
                          className={cn(META_INPUT, 'w-32 pl-7 font-semibold')}
                        />
                      )}
                    />
                  </div>
                  {errors.amountPaid ? (
                    <p className="mt-1 text-right text-xs font-medium text-danger">{errors.amountPaid.message}</p>
                  ) : (
                    salePaid !== null &&
                    salePaid !== safeInt(values.amountPaid) && (
                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        Sale has <span className="money font-semibold text-foreground">{formatDollars(salePaid)}</span> paid ·{' '}
                        <button
                          type="button"
                          className="font-semibold text-primary underline-offset-2 hover:underline"
                          onClick={() => form.setValue('amountPaid', salePaid, { shouldDirty: true, shouldValidate: true })}
                        >
                          Use it
                        </button>
                      </p>
                    )
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-success/10 px-4 py-3 ring-1 ring-success/25">
                  <span className="text-xs font-bold text-success">Total due (AUD)</span>
                  <span className="money font-extrabold text-success">{formatDollars(totals.due)}</span>
                </div>
              </div>

              {/* Notes / banking */}
              <div className="space-y-5 rounded-r-xl border-l-4 border-success bg-muted/60 p-5 sm:p-6">
                <p className="text-sm font-bold">Notes &amp; terms</p>

                <div className="grid gap-5 rounded-lg border bg-card p-4 sm:grid-cols-3">
                  {BANK_FIELDS.map(({ name, label, mono }) => (
                    <div key={name} className="space-y-0.5">
                      <label htmlFor={`inv-${name}`} className="text-[11px] text-muted-foreground">
                        {label}
                      </label>
                      <Input id={`inv-${name}`} autoComplete="off" className={cn(LINE_INPUT, 'h-8 text-sm', mono && 'money')} {...form.register(name)} />
                    </div>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="inv-notes" className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    Additional notes
                  </label>
                  <Textarea
                    id="inv-notes"
                    rows={2}
                    placeholder="Printed in bold under the bank details (optional)"
                    aria-invalid={!!errors.notes}
                    className="resize-none bg-card"
                    {...form.register('notes')}
                  />
                  {errors.notes && <p className="text-xs font-medium text-danger">{errors.notes.message}</p>}
                </div>

                <p className="text-xs text-muted-foreground italic">
                  Upon payment, customer agrees to {issuer?.companyName} terms and conditions.
                </p>
              </div>

              {/* GST */}
              <div className="flex justify-center">
                <label
                  htmlFor="inv-gst"
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-3 rounded-full px-4 py-1.5 text-[11px] font-bold tracking-wider uppercase ring-1 transition-colors',
                    values.gstIncluded ? 'bg-success/10 text-success ring-success/25' : 'bg-muted text-muted-foreground ring-border',
                  )}
                >
                  <Controller
                    control={form.control}
                    name="gstIncluded"
                    render={({ field }) => (
                      <Switch id="inv-gst" checked={field.value} onCheckedChange={field.onChange} className="data-checked:bg-success" />
                    )}
                  />
                  {values.gstIncluded ? 'GST included' : 'No GST'}
                </label>
              </div>
            </div>
          </div>
        </form>
      </FormModalBody>

      <FormModalFooter maxWidth={WIDTH}>{actions}</FormModalFooter>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && !leaving.current && blocker.state === 'blocked') blocker.reset()
        }}
        title="Leave without generating?"
        description="Your changes to this invoice haven't been saved."
        confirmLabel="Leave"
        tone="danger"
        onConfirm={() => {
          if (blocker.state !== 'blocked') return
          leaving.current = true
          blocker.proceed()
        }}
      />
    </>
  )
}
