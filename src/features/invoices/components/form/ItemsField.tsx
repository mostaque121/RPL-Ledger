import { useMemo } from 'react'
import { LibraryBigIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { Controller, useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form'
import { Combobox } from '@/components/forms/Combobox'
import { MoneyInput } from '@/components/forms/MoneyInput'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { invoiceLineAmount } from '@/lib/accounting'
import { formatDollars } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { InvoiceValues } from '../../schema'
import { LINE_INPUT, SectionLabel } from './paper'

interface ItemsFieldProps {
  form: UseFormReturn<InvoiceValues>
  /** Offered by the course picker; the description stays free text. */
  courseNames: string[]
}

const safe = (n: number | null | undefined) => (Number.isInteger(n) ? (n as number) : 0)

/**
 * Invoice lines laid out like the PDF table. The description wraps and grows, so long course
 * names stay readable while editing; the book button picks a course to fill it in.
 */
export function ItemsField({ form, courseNames }: ItemsFieldProps) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' })
  const items = useWatch({ control: form.control, name: 'items' })
  const errors = form.formState.errors.items
  const courseOptions = useMemo(() => courseNames.map((name) => ({ value: name, label: name })), [courseNames])

  return (
    <div>
      <SectionLabel>Items</SectionLabel>

      <div className="mt-3 hidden grid-cols-12 gap-4 rounded-lg bg-muted px-4 py-2.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase sm:grid">
        <span className="col-span-6">Description</span>
        <span className="col-span-1 text-center">Qty</span>
        <span className="col-span-2 text-right">Price</span>
        <span className="col-span-3 pr-9 text-right">Amount</span>
      </div>

      <div className="divide-y">
        {fields.map((f, i) => {
          const err = errors?.[i]
          const line = items?.[i]
          const amount = invoiceLineAmount({ quantity: safe(line?.quantity), unitPrice: safe(line?.unitPrice) })
          const message = [err?.description?.message, err?.quantity?.message, err?.unitPrice?.message].filter(Boolean).join(' · ')
          return (
            <div key={f.id} className="py-3 sm:px-4">
              <div className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-start gap-x-4 gap-y-2 sm:grid-cols-12">
                {/* Description: wraps and grows with the text, plus a course picker */}
                <div className="col-span-3 flex items-start gap-1 sm:col-span-6">
                  <Textarea
                    aria-label={`Item ${i + 1} description`}
                    rows={1}
                    placeholder="Pick a course or type anything"
                    aria-invalid={!!err?.description}
                    className={cn(LINE_INPUT, 'h-auto min-h-9 resize-none py-2 leading-snug font-medium')}
                    {...form.register(`items.${i}.description`)}
                  />
                  <Combobox
                    value={null}
                    onChange={(name) =>
                      name && form.setValue(`items.${i}.description`, name, { shouldDirty: true, shouldValidate: true })
                    }
                    options={courseOptions}
                    searchPlaceholder="Search courses…"
                    aria-label={`Pick a course for item ${i + 1}`}
                    trigger={<LibraryBigIcon className="size-4" />}
                    className="mt-0.5 size-8 w-8 shrink-0 justify-center border-0 px-0 text-muted-foreground shadow-none hover:bg-accent hover:text-accent-foreground dark:bg-transparent"
                    contentClassName="w-[min(30rem,calc(100vw-2rem))]"
                  />
                </div>
                <Input
                  aria-label={`Item ${i + 1} quantity`}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  aria-invalid={!!err?.quantity}
                  className={cn(LINE_INPUT, 'money text-center sm:col-span-1')}
                  {...form.register(`items.${i}.quantity`, { valueAsNumber: true })}
                />
                <div className="sm:col-span-2">
                  <Controller
                    control={form.control}
                    name={`items.${i}.unitPrice`}
                    render={({ field }) => (
                      <MoneyInput
                        aria-label={`Item ${i + 1} price`}
                        symbol="$"
                        placeholder="0"
                        value={field.value ?? null}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        aria-invalid={!!err?.unitPrice}
                        className={cn(LINE_INPUT, 'pl-7')}
                      />
                    )}
                  />
                </div>
                <div className="flex h-9 items-center justify-end gap-2 sm:col-span-3">
                  <span className="money text-sm font-bold">{formatDollars(amount)}</span>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    disabled={fields.length === 1}
                    aria-label={`Remove item ${i + 1}`}
                    className="grid size-7 place-items-center rounded-md text-muted-foreground/60 transition-colors hover:bg-danger/10 hover:text-danger disabled:invisible"
                  >
                    <Trash2Icon className="size-3.5" />
                  </button>
                </div>
              </div>
              {message && <p className="mt-1.5 text-xs font-medium text-danger">{message}</p>}
            </div>
          )
        })}
      </div>

      {errors?.root?.message && <p className="text-xs font-medium text-danger">{errors.root.message}</p>}

      <button
        type="button"
        disabled={fields.length >= 20}
        onClick={() => append({ description: '', quantity: 1, unitPrice: null as unknown as number })}
        className="mt-2 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-accent disabled:opacity-50 sm:ml-1"
      >
        <PlusIcon className="size-3.5" />
        Add line item
      </button>
    </div>
  )
}
