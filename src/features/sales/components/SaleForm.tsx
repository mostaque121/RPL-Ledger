import { useRef, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { EyeIcon, FileTextIcon, GraduationCapIcon, Loader2Icon, UserRoundIcon, WalletIcon, type LucideIcon } from 'lucide-react'
import { Controller, useForm, useWatch, type Control, type FieldError as RhfFieldError } from 'react-hook-form'
import { useBlocker } from 'react-router'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { Combobox } from '@/components/forms/Combobox'
import { DatePicker } from '@/components/forms/DatePicker'
import { MoneyInput } from '@/components/forms/MoneyInput'
import { FormModalBody, FormModalFooter, FormModalHeader } from '@/components/layout/FormModal'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { coursesApi } from '@/features/settings/api/courses'
import { saleProfit, type Settings } from '@/lib/accounting'
import { formatAud, todayInSydney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useCreateSaleMutation, useUpdateSaleMutation, type SaleInput, type SaleView } from '../api/sales'
import { useSaleOptions } from '../hooks/use-sale-options'
import { SALE_SOURCES, saleSchema, type SaleValues } from '../schema'
import { SalePreview } from './SalePreview'

const WIDTH = '52rem'

interface SaleFormProps {
  settings: Settings
  /** The sale to edit, or undefined to add one. */
  sale?: SaleView
  /** After saving, with the sale's id. */
  onSaved: (saleId: string, created: boolean) => void
}

function defaults(sale?: SaleView): SaleValues {
  const today = todayInSydney()
  return {
    saleDate: sale?.saleDate ?? today,
    sellerId: sale?.sellerId ?? '',
    clientName: sale?.clientName ?? '',
    phone: sale?.phone ?? '',
    email: sale?.email ?? '',
    courseId: sale?.courseId ?? '',
    rtoId: sale?.rtoId ?? '',
    courseFee: sale ? sale.courseFee : (null as unknown as number),
    rtoCost: sale ? sale.rtoCost : null,
    referralCommission: sale ? sale.referralCommission : null,
    source: sale?.source ?? 'Website',
    docsLink: sale?.docsLink ?? '',
    notes: sale?.notes ?? '',
    firstPayment: null,
    firstPaymentOn: today,
  }
}

const orNull = (text: string) => (text.trim() === '' ? null : text.trim())

/** Keeps inactive items that this sale already uses, so editing an old sale still shows them. */
/** One block of the form: a titled card. */
function FormCard({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-card ring-1 ring-foreground/10">
      <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-5">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </header>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  )
}

/** Add or edit a sale, in the full-page form modal (see `SaleModal`). */
export function SaleForm({ settings, sale, onSaved }: SaleFormProps) {
  const { people, sellerOptions, courseOptions, rtoOptions } = useSaleOptions(sale)
  const createCourse = coursesApi.useCreateMutation()
  const create = useCreateSaleMutation()
  const update = useUpdateSaleMutation()
  const pending = create.isPending || update.isPending
  const [previewing, setPreviewing] = useState(false)

  const form = useForm<SaleValues>({ resolver: zodResolver(saleSchema), defaultValues: defaults(sale) })
  const { errors, isDirty } = form.formState
  const [sellerId, courseFee, rtoCost, referral, firstPayment] = useWatch({
    control: form.control,
    name: ['sellerId', 'courseFee', 'rtoCost', 'referralCommission', 'firstPayment'],
  })

  // Closing is a navigation (✕, Escape and Back all go through the URL), so one blocker asks
  // before any of them throws away unsaved changes. Saving navigates on purpose.
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

  const seller = people.data?.find((p) => p.id === sellerId)
  const money = { courseFee: courseFee ?? 0, rtoCost: rtoCost ?? 0, referralCommission: referral ?? 0 }
  const { netProfit } = saleProfit(money, settings)

  function submit(v: SaleValues) {
    const input: SaleInput = {
      saleDate: v.saleDate,
      sellerId: v.sellerId,
      clientName: v.clientName,
      phone: orNull(v.phone),
      email: orNull(v.email),
      courseId: v.courseId || null,
      rtoId: v.rtoId || null,
      courseFee: v.courseFee,
      rtoCost: v.rtoCost ?? 0,
      referralCommission: v.referralCommission ?? 0,
      source: v.source,
      docsLink: orNull(v.docsLink),
      notes: orNull(v.notes),
    }
    const done = (id: string, created: boolean) => {
      saved.current = true
      onSaved(id, created)
    }
    if (sale) {
      update.mutate({ id: sale.id, ...input }, { onSuccess: () => done(sale.id, false) })
    } else {
      const firstPaymentInput = v.firstPayment ? { paidOn: v.firstPaymentOn, amount: v.firstPayment } : null
      create.mutate({ ...input, firstPayment: firstPaymentInput }, { onSuccess: (id) => done(id, true) })
    }
  }

  // `saved` is only read in the save callback and the leave-page check, never while rendering.
  // oxlint-disable-next-line react/refs
  const onSubmit = form.handleSubmit(submit)

  const actions = (
    <>
      <Button variant="outline" onClick={() => setPreviewing(true)}>
        <EyeIcon />
        Preview
        <span className={cn('money hidden font-bold lg:inline', netProfit < 0 ? 'text-danger' : 'text-success')}>
          {formatAud(netProfit)}
        </span>
      </Button>
      <Button type="submit" form="sale-form" disabled={pending} className="font-bold">
        {pending && <Loader2Icon className="animate-spin" />}
        {sale ? 'Save changes' : 'Add sale'}
      </Button>
    </>
  )

  return (
    <>
      <FormModalHeader
        title={sale ? `Edit sale · ${sale.clientName}` : 'Add sale'}
        actions={actions}
        maxWidth={WIDTH}
      />

      <FormModalBody maxWidth={WIDTH}>
        <p className="mb-5 text-xs text-muted-foreground">
          {sale
            ? 'Payments, RTO payments and completion are managed from the sale page.'
            : 'Profit counts when you mark the sale as completed.'}
        </p>

        <form id="sale-form" onSubmit={onSubmit} noValidate className="space-y-5">
          <FormCard icon={UserRoundIcon} title="Client">
            <Field data-invalid={!!errors.clientName}>
              <FieldLabel htmlFor="sale-client">Client name</FieldLabel>
              <Input id="sale-client" autoFocus autoComplete="off" aria-invalid={!!errors.clientName} {...form.register('clientName')} />
              <FieldError errors={[errors.clientName]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.phone}>
                <FieldLabel htmlFor="sale-phone">Phone</FieldLabel>
                <Input id="sale-phone" type="tel" autoComplete="off" {...form.register('phone')} />
                <FieldError errors={[errors.phone]} />
              </Field>
              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="sale-email">Email</FieldLabel>
                <Input id="sale-email" type="email" autoComplete="off" aria-invalid={!!errors.email} {...form.register('email')} />
                <FieldError errors={[errors.email]} />
              </Field>
            </div>
          </FormCard>

          <FormCard icon={GraduationCapIcon} title="Sale" description="Who sold it, when, and which course and RTO.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={!!errors.saleDate}>
                <FieldLabel htmlFor="sale-date">Sale date</FieldLabel>
                <Controller
                  control={form.control}
                  name="saleDate"
                  render={({ field }) => (
                    <DatePicker id="sale-date" value={field.value} onChange={(d) => field.onChange(d ?? '')} invalid={!!errors.saleDate} />
                  )}
                />
                <FieldError errors={[errors.saleDate]} />
              </Field>
              <Field data-invalid={!!errors.sellerId}>
                <FieldLabel htmlFor="sale-seller">Sold by</FieldLabel>
                <Controller
                  control={form.control}
                  name="sellerId"
                  render={({ field }) => (
                    <Combobox
                      id="sale-seller"
                      value={field.value || null}
                      onChange={(id) => field.onChange(id ?? '')}
                      options={sellerOptions}
                      placeholder="Pick the seller"
                      invalid={!!errors.sellerId}
                    />
                  )}
                />
                <FieldError errors={[errors.sellerId]} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <Field>
                <FieldLabel htmlFor="sale-course">Course</FieldLabel>
                <Controller
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <Combobox
                      id="sale-course"
                      value={field.value || null}
                      onChange={(id) => field.onChange(id ?? '')}
                      options={courseOptions}
                      placeholder="Pick a course"
                      searchPlaceholder="Search or add a course…"
                      onCreate={(name) => createCourse.mutateAsync(name)}
                      clearable
                    />
                  )}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="sale-rto">RTO</FieldLabel>
                <Controller
                  control={form.control}
                  name="rtoId"
                  render={({ field }) => (
                    <Combobox
                      id="sale-rto"
                      value={field.value || null}
                      onChange={(id) => field.onChange(id ?? '')}
                      options={rtoOptions}
                      placeholder="Pick the RTO"
                      clearable
                    />
                  )}
                />
              </Field>
            </div>
            <Field className="sm:max-w-[calc(50%-0.5rem)]">
              <FieldLabel htmlFor="sale-source">Source</FieldLabel>
              <Controller
                control={form.control}
                name="source"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="sale-source" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {SALE_SOURCES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </FormCard>

          <FormCard icon={WalletIcon} title="Money" description="Use Preview to see the profit, tax and who gets what.">
            <div className="grid gap-4 sm:grid-cols-3">
              <MoneyField control={form.control} name="courseFee" id="sale-fee" label="Course fee" error={errors.courseFee} />
              <MoneyField control={form.control} name="rtoCost" id="sale-rto-cost" label="RTO cost" hint="Leave empty if not known yet." error={errors.rtoCost} />
              <MoneyField
                control={form.control}
                name="referralCommission"
                id="sale-referral"
                label="Referral"
                placeholder="0"
                hint="Paid to an outside referrer."
                error={errors.referralCommission}
              />
            </div>

            {!sale && (
              <div className="space-y-3 rounded-lg border border-dashed p-3 sm:p-4">
                <p className="text-sm font-semibold">
                  Paid today? <span className="font-normal text-muted-foreground">(optional)</span>
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <MoneyField control={form.control} name="firstPayment" id="sale-first-payment" label="Amount received" placeholder="0" error={errors.firstPayment} />
                  <Field data-invalid={!!errors.firstPaymentOn}>
                    <FieldLabel htmlFor="sale-first-payment-on">Received on</FieldLabel>
                    <Controller
                      control={form.control}
                      name="firstPaymentOn"
                      render={({ field }) => (
                        <DatePicker
                          id="sale-first-payment-on"
                          value={field.value || null}
                          onChange={(d) => field.onChange(d ?? '')}
                          disabled={!firstPayment}
                          invalid={!!errors.firstPaymentOn}
                        />
                      )}
                    />
                    <FieldError errors={[errors.firstPaymentOn]} />
                  </Field>
                </div>
              </div>
            )}
          </FormCard>

          <FormCard icon={FileTextIcon} title="Documents">
            <Field data-invalid={!!errors.docsLink}>
              <FieldLabel htmlFor="sale-docs">Documents link</FieldLabel>
              <Input id="sale-docs" type="url" placeholder="https://drive.google.com/…" aria-invalid={!!errors.docsLink} {...form.register('docsLink')} />
              <FieldError errors={[errors.docsLink]} />
            </Field>
          </FormCard>
        </form>
      </FormModalBody>

      <FormModalFooter maxWidth={WIDTH}>{actions}</FormModalFooter>

      <Dialog open={previewing} onOpenChange={setPreviewing}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Profit preview</DialogTitle>
          </DialogHeader>
          <SalePreview
            {...money}
            seller={seller ? (seller.partnerKey ?? 'employee') : null}
            sellerName={seller?.name}
            settings={settings}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={blocker.state === 'blocked'}
        onOpenChange={(open) => {
          if (!open && !leaving.current && blocker.state === 'blocked') blocker.reset()
        }}
        title="Leave without saving?"
        description={sale ? 'Your changes to this sale haven\'t been saved.' : 'This sale hasn\'t been added yet.'}
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

type MoneyName = 'courseFee' | 'rtoCost' | 'referralCommission' | 'firstPayment'

interface MoneyFieldProps {
  control: Control<SaleValues>
  name: MoneyName
  id: string
  label: string
  placeholder?: string
  hint?: string
  error?: RhfFieldError
}

function MoneyField({ control, name, id, label, placeholder, hint, error }: MoneyFieldProps) {
  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <MoneyInput
            id={id}
            placeholder={placeholder}
            value={field.value ?? null}
            onChange={field.onChange}
            onBlur={field.onBlur}
            aria-invalid={!!error}
          />
        )}
      />
      {hint && !error && <FieldDescription className="text-xs">{hint}</FieldDescription>}
      <FieldError errors={[error]} />
    </Field>
  )
}
