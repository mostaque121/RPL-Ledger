import { z } from 'zod'
import { cents, isoDate, optionalText } from '@/features/sales/schema'
import { invoiceTotals } from '@/lib/accounting'

const optionalEmail = z.union([z.literal(''), z.email('Enter a valid email')])

/** Company and bank details printed on an invoice. */
export const issuerSchema = z.object({
  companyName: z.string().trim().min(1, 'Enter the company name').max(120, 'Keep it under 120 characters'),
  address: optionalText(300),
  phone: optionalText(40),
  email: optionalEmail,
  website: optionalText(120),
  abn: optionalText(20),
  bankAccountName: optionalText(120),
  bankBsb: optionalText(20),
  bankAccountNumber: optionalText(30),
})
export type IssuerValues = z.infer<typeof issuerSchema>

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, 'Describe the item').max(200, 'Keep it under 200 characters'),
  quantity: z
    .number({ error: 'Qty' })
    .int('Whole number')
    .min(1, 'At least 1')
    .max(999, 'Too many'),
  unitPrice: cents('Enter the price'),
})
export type InvoiceItemValues = z.infer<typeof invoiceItemSchema>

export const invoiceSchema = z
  .object({
    number: z.string().trim().min(1, 'Enter the invoice number').max(30, 'Keep it under 30 characters'),
    /** '' when not linked to a sale. */
    saleId: z.string(),
    issuedOn: isoDate('Pick the invoice date'),
    dueOn: isoDate('Pick the due date'),
    billToName: z.string().trim().min(1, "Enter the client's name").max(120, 'Keep it under 120 characters'),
    billToEmail: optionalEmail,
    billToPhone: optionalText(40),
    items: z.array(invoiceItemSchema).min(1, 'Add at least one item').max(20, 'Up to 20 items'),
    amountPaid: cents('Enter 0 if nothing is paid yet'),
    gstIncluded: z.boolean(),
    notes: optionalText(1000),
    issuer: issuerSchema,
  })
  .refine((v) => v.dueOn >= v.issuedOn, { path: ['dueOn'], message: "Can't be before the invoice date" })
  .refine((v) => v.amountPaid <= invoiceTotals(v.items, 0, false).total, {
    path: ['amountPaid'],
    message: "Can't be more than the total",
  })
export type InvoiceValues = z.infer<typeof invoiceSchema>

/** Settings → invoice details. */
export const invoiceProfileSchema = issuerSchema.extend({
  numberPrefix: z
    .string()
    .trim()
    .max(10, 'Up to 10 characters')
    .regex(/^[A-Za-z0-9/-]*$/, 'Letters, digits, - and / only'),
  firstNumber: z
    .number({ error: 'Enter a number' })
    .int('Whole number')
    .min(1, 'At least 1')
    .max(99_999_999, 'Too big'),
  paymentTermsDays: z
    .number({ error: 'Enter the days (0 = due on the day)' })
    .int('Whole days')
    .min(0, "Can't be negative")
    .max(365, 'Up to 365 days'),
  gstIncluded: z.boolean(),
  defaultNotes: optionalText(1000),
})
export type InvoiceProfileValues = z.infer<typeof invoiceProfileSchema>

/** Everything printed on the PDF (the form, minus the sale link). */
export type InvoiceDocumentData = Omit<InvoiceValues, 'saleId'>
