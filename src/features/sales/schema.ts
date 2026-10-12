import { z } from 'zod'
import type { SaleSource } from '@/types/db'

export const SALE_SOURCES = ['Website', 'Reference', 'Repeat client', 'Other'] as const satisfies readonly SaleSource[]

export const isoDate = (message: string) => z.string({ error: message }).regex(/^\d{4}-\d{2}-\d{2}$/, message)

/** Money in the forms is integer cents (MoneyInput's minor units). */
export const MAX_CENTS = 10_000_000_00
export const cents = (required: string) =>
  z
    .number({ error: required })
    .int()
    .nonnegative("Can't be negative")
    .max(MAX_CENTS, 'That looks too big')

export const optionalText = (max: number) => z.string().trim().max(max, `Keep it under ${max} characters`)

export const saleSchema = z
  .object({
    saleDate: isoDate('Pick the sale date'),
    sellerId: z.string().min(1, 'Pick who made the sale'),
    clientName: z.string().trim().min(1, "Enter the client's name").max(120, 'Keep it under 120 characters'),
    phone: optionalText(40),
    email: z.union([z.literal(''), z.email('Enter a valid email')]),
    courseId: z.string(),
    rtoId: z.string(),
    courseFee: cents('Enter the course fee'),
    rtoCost: cents('Enter the RTO cost (0 if none)'),
    referralCommission: cents('Enter 0 if there is no referral').nullable(),
    source: z.enum(SALE_SOURCES),
    docsLink: z.union([z.literal(''), z.url('Enter a full link, starting with https://')]),
    notes: optionalText(1000),
    /** Add form only: a payment taken on the day. */
    firstPayment: cents('Enter an amount').nullable(),
    firstPaymentOn: z.string(),
  })
  .refine((v) => v.firstPayment === null || v.firstPayment > 0, {
    path: ['firstPayment'],
    message: 'Leave empty if nothing was paid',
  })
  .refine((v) => v.firstPayment === null || /^\d{4}-\d{2}-\d{2}$/.test(v.firstPaymentOn), {
    path: ['firstPaymentOn'],
    message: 'Pick the payment date',
  })

export type SaleValues = z.infer<typeof saleSchema>

export const paymentSchema = z.object({
  paidOn: isoDate('Pick the date'),
  amount: z
    .number({ error: 'Enter the amount' })
    .int()
    .refine((n) => n !== 0, "Can't be 0")
    .refine((n) => Math.abs(n) <= MAX_CENTS, 'That looks too big'),
  agency: optionalText(20),
  note: optionalText(200),
})

export type PaymentValues = z.infer<typeof paymentSchema>

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'What needs doing?').max(200, 'Keep it under 200 characters'),
  /** Optional: a task without a date is "whenever". */
  dueOn: isoDate('Pick a valid date').nullable(),
})

export type TaskValues = z.infer<typeof taskSchema>

/** A task added from the Tasks page, where a sale can be picked. Empty = a general task. */
export const newTaskSchema = taskSchema.extend({ saleId: z.string() })

export type NewTaskValues = z.infer<typeof newTaskSchema>

export const noteSchema = z.object({
  body: z.string().trim().min(1, 'Write something first').max(4000, 'Keep it under 4000 characters'),
  pinned: z.boolean(),
})

export type NoteValues = z.infer<typeof noteSchema>
