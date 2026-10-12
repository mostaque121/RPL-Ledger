import type { FieldError as RhfFieldError, UseFormRegisterReturn } from 'react-hook-form'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { IssuerValues } from '../../schema'

type IssuerKey = keyof IssuerValues

interface IssuerFieldsProps {
  /** `id` prefix, so the fields stay unique when two forms are on screen. */
  idPrefix: string
  register: (name: IssuerKey) => UseFormRegisterReturn
  errors?: Partial<Record<IssuerKey, RhfFieldError>>
  /**
   * Show only one part: the invoice form edits bank details in its notes box, and
   * Settings puts each part in its own row. Both by default.
   */
  part?: 'company' | 'bank'
}

const COMPANY: { key: IssuerKey; label: string; placeholder?: string; type?: string; wide?: boolean }[] = [
  { key: 'companyName', label: 'Company name', wide: true },
  { key: 'abn', label: 'ABN', placeholder: '12 345 678 901' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'website', label: 'Website', placeholder: 'rplfasttrack.com.au' },
]

const BANK: { key: IssuerKey; label: string; placeholder?: string }[] = [
  { key: 'bankAccountName', label: 'Account name' },
  { key: 'bankBsb', label: 'BSB', placeholder: '062-000' },
  { key: 'bankAccountNumber', label: 'Account number' },
]

/** Company and bank details printed on invoices. Used on Settings and inside the invoice form. */
export function IssuerFields({ idPrefix, register, errors = {}, part }: IssuerFieldsProps) {
  const field = (key: IssuerKey, label: string, opts: { placeholder?: string; type?: string; className?: string } = {}) => (
    <Field key={key} data-invalid={!!errors[key]} className={opts.className}>
      <FieldLabel htmlFor={`${idPrefix}-${key}`}>{label}</FieldLabel>
      <Input
        id={`${idPrefix}-${key}`}
        type={opts.type ?? 'text'}
        placeholder={opts.placeholder}
        autoComplete="off"
        aria-invalid={!!errors[key]}
        {...register(key)}
      />
      <FieldError errors={[errors[key]]} />
    </Field>
  )

  const bankGrid = <div className="grid gap-4 sm:grid-cols-3">{BANK.map((f) => field(f.key, f.label, f))}</div>
  if (part === 'bank') return bankGrid

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {COMPANY.map((f) => field(f.key, f.label, { ...f, className: cn(f.wide && 'sm:col-span-2') }))}
        <Field data-invalid={!!errors.address} className="sm:col-span-2">
          <FieldLabel htmlFor={`${idPrefix}-address`}>Address</FieldLabel>
          <Textarea
            id={`${idPrefix}-address`}
            rows={2}
            placeholder={'Street\nSuburb NSW 2000, Australia'}
            aria-invalid={!!errors.address}
            {...register('address')}
          />
          <FieldError errors={[errors.address]} />
        </Field>
      </div>

      {part !== 'company' && (
        <div>
          <p className="mb-3 text-xs font-bold tracking-wide text-muted-foreground uppercase">Bank details</p>
          {bankGrid}
        </div>
      )}
    </div>
  )
}
