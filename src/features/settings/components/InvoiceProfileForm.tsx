import { zodResolver } from '@hookform/resolvers/zod'
import { FileTextIcon } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useInvoicesQuery } from '@/features/invoices/api/invoices'
import { useSaveInvoiceProfileMutation, type InvoiceProfile } from '@/features/invoices/api/profile'
import { IssuerFields } from '@/features/invoices/components/form/IssuerFields'
import { nextInvoiceNumber } from '@/features/invoices/numbering'
import { invoiceProfileSchema, type InvoiceProfileValues } from '@/features/invoices/schema'
import { Skeleton } from '@/components/ui/skeleton'
import { FieldSkeleton, SaveBar, SettingsHeader, SettingsRow } from './settings-ui'

const HEADER = {
  icon: FileTextIcon,
  title: 'Invoice details',
  description: 'Filled in on every new invoice. You can still change any of it on a single invoice.',
}

const ROWS = {
  company: { title: 'Company', description: 'Printed at the top of every invoice.' },
  bank: { title: 'Bank details', description: 'Where clients pay. Printed under the totals.' },
  numbering: {
    title: 'Numbering',
    description: 'New invoices take the next number after the highest one used, never lower than “Start at”.',
  },
  terms: { title: 'Payment terms', description: 'When the money is due, and how prices are shown.' },
  notes: {
    title: 'Additional notes',
    description:
      'Printed in bold under the bank details. The “Upon payment, customer agrees to … terms and conditions” line is always added.',
  },
}

/** The page while the invoice details load: every row and label in place, the inputs waiting. */
export function InvoiceProfileSkeleton() {
  return (
    <div className="space-y-2" role="status" aria-label="Loading invoice details">
      <SettingsHeader {...HEADER} />
      <div>
        <SettingsRow {...ROWS.company}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldSkeleton label="Company name" className="sm:col-span-2" />
            <FieldSkeleton label="ABN" />
            <FieldSkeleton label="Phone" />
            <FieldSkeleton label="Email" />
            <FieldSkeleton label="Website" />
          </div>
        </SettingsRow>
        <SettingsRow {...ROWS.bank}>
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldSkeleton label="Account name" />
            <FieldSkeleton label="BSB" />
            <FieldSkeleton label="Account number" />
          </div>
        </SettingsRow>
        <SettingsRow {...ROWS.numbering}>
          <div className="grid max-w-sm grid-cols-2 gap-4">
            <FieldSkeleton label="Prefix" />
            <FieldSkeleton label="Start at" />
          </div>
        </SettingsRow>
        <SettingsRow {...ROWS.terms}>
          <div className="max-w-md space-y-4">
            <FieldSkeleton label="Due after (days)" className="max-w-40" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
        </SettingsRow>
        <SettingsRow {...ROWS.notes}>
          <Skeleton className="h-24 rounded-lg" />
        </SettingsRow>
      </div>
      <SaveBar dirty={false} pending={false} onReset={() => {}} />
    </div>
  )
}

/** What every new invoice starts with: company, bank, numbering, terms. All editable per invoice. */
export function InvoiceProfileForm({ profile }: { profile: InvoiceProfile }) {
  const save = useSaveInvoiceProfileMutation()
  const invoices = useInvoicesQuery()
  const form = useForm<InvoiceProfileValues>({ resolver: zodResolver(invoiceProfileSchema), values: profile })
  const { errors, isDirty } = form.formState
  const [prefix, firstNumber] = useWatch({ control: form.control, name: ['numberPrefix', 'firstNumber'] })
  const register = (name: Parameters<typeof form.register>[0]) => form.register(name)

  const next =
    invoices.data && Number.isInteger(firstNumber) && firstNumber > 0
      ? nextInvoiceNumber(
          invoices.data.map((i) => i.number),
          prefix ?? '',
          firstNumber,
        )
      : null

  return (
    <div className="space-y-2">
      <SettingsHeader {...HEADER} />

      <form onSubmit={form.handleSubmit((v) => save.mutate(v))} noValidate>
        <div>
          <SettingsRow {...ROWS.company}>
            <IssuerFields idPrefix="profile" part="company" register={register} errors={errors} />
          </SettingsRow>

          <SettingsRow {...ROWS.bank}>
            <IssuerFields idPrefix="profile" part="bank" register={register} errors={errors} />
          </SettingsRow>

          <SettingsRow {...ROWS.numbering}>
            <div className="grid max-w-sm grid-cols-2 gap-4">
              <Field data-invalid={!!errors.numberPrefix}>
                <FieldLabel htmlFor="profile-prefix">Prefix</FieldLabel>
                <Input id="profile-prefix" autoComplete="off" aria-invalid={!!errors.numberPrefix} {...form.register('numberPrefix')} />
                <FieldError errors={[errors.numberPrefix]} />
              </Field>
              <Field data-invalid={!!errors.firstNumber}>
                <FieldLabel htmlFor="profile-first">Start at</FieldLabel>
                <Input
                  id="profile-first"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  className="money"
                  aria-invalid={!!errors.firstNumber}
                  {...form.register('firstNumber', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.firstNumber]} />
              </Field>
            </div>
            {next && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-accent/60 px-2.5 py-1 text-xs">
                Next invoice <span className="money font-bold text-accent-foreground">{next}</span>
              </p>
            )}
          </SettingsRow>

          <SettingsRow {...ROWS.terms}>
            <div className="max-w-md space-y-4">
              <Field data-invalid={!!errors.paymentTermsDays} className="max-w-40">
                <FieldLabel htmlFor="profile-terms">Due after (days)</FieldLabel>
                <Input
                  id="profile-terms"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className="money"
                  aria-invalid={!!errors.paymentTermsDays}
                  {...form.register('paymentTermsDays', { valueAsNumber: true })}
                />
                <FieldError errors={[errors.paymentTermsDays]} />
              </Field>

              <Field orientation="horizontal" className="rounded-lg border p-3">
                <div className="flex-1">
                  <FieldLabel htmlFor="profile-gst">Prices include GST</FieldLabel>
                  <FieldDescription className="text-xs">Prints a "GST Included" badge on the invoice.</FieldDescription>
                </div>
                <Controller
                  control={form.control}
                  name="gstIncluded"
                  render={({ field }) => <Switch id="profile-gst" checked={field.value} onCheckedChange={field.onChange} />}
                />
              </Field>
            </div>
          </SettingsRow>

          <SettingsRow {...ROWS.notes}>
            <Field data-invalid={!!errors.defaultNotes}>
              <FieldLabel htmlFor="profile-notes" className="sr-only">
                Additional notes
              </FieldLabel>
              <Textarea id="profile-notes" rows={4} aria-invalid={!!errors.defaultNotes} {...form.register('defaultNotes')} />
              <FieldError errors={[errors.defaultNotes]} />
            </Field>
          </SettingsRow>
        </div>

        <SaveBar dirty={isDirty} pending={save.isPending} onReset={() => form.reset()} />
      </form>
    </div>
  )
}
