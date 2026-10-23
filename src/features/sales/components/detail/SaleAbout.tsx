import type { ReactNode } from 'react'
import {
  BookOpenIcon,
  CalendarIcon,
  CircleCheckBigIcon,
  ExternalLinkIcon,
  HandCoinsIcon,
  LandmarkIcon,
  Loader2Icon,
  MailIcon,
  MegaphoneIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react'
import type { ZodType } from 'zod'
import { pickWidth } from '@/components/feedback/skeleton-widths'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { Combobox } from '@/components/forms/Combobox'
import { DatePicker } from '@/components/forms/DatePicker'
import { InlineText, InlineTriggerContent } from '@/components/forms/InlineEdit'
import { INLINE_TRIGGER } from '@/components/forms/inline-edit-styles'
import { Button } from '@/components/ui/button'
import { coursesApi } from '@/features/settings/api/courses'
import { formatAudShort, formatDate } from '@/lib/format'
import type { SaleSource } from '@/types/db'
import { usePatchSaleMutation, type SalePatch, type SaleView } from '../../api/sales'
import { useSaleModal } from '../../hooks/use-sale-modal'
import { useSaleOptions } from '../../hooks/use-sale-options'
import { SALE_SOURCES, saleSchema } from '../../schema'
import { Panel } from './Panel'

interface RowProps {
  icon: LucideIcon
  label: string
  /** An inline edit of this row is being saved. */
  saving?: boolean
  children: ReactNode
}

function Row({ icon: Icon, label, saving, children }: RowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
          {label}
          {saving && <Loader2Icon className="size-3 animate-spin" aria-label="Saving" />}
        </dt>
        <dd className="text-sm font-medium wrap-break-word">{children}</dd>
      </div>
    </div>
  )
}

const LINK = 'text-primary underline-offset-4 hover:underline'

/** The rows every sale has (completed and referral only show when set). */
const SKELETON_ROWS: [LucideIcon, string][] = [
  [PhoneIcon, 'Phone'],
  [MailIcon, 'Email'],
  [BookOpenIcon, 'Course'],
  [LandmarkIcon, 'RTO'],
  [UserIcon, 'Sold by'],
  [CalendarIcon, 'Sale date'],
  [MegaphoneIcon, 'Source'],
  [ExternalLinkIcon, 'Documents'],
]
const VALUE_WIDTHS = ['w-28', 'w-44', 'w-52', 'w-14', 'w-20', 'w-24', 'w-16', 'w-28'] as const

/** The details card while the sale loads: the same labels, the values waiting. */
export function SaleAboutSkeleton() {
  return (
    <Panel className="pb-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">About this sale</h3>
        <Button variant="ghost" size="xs" disabled>
          <PencilIcon />
          Edit all
        </Button>
      </div>
      <dl className="mt-1 divide-y">
        {SKELETON_ROWS.map(([icon, label], i) => (
          <Row key={label} icon={icon} label={label}>
            <SkeletonText className={pickWidth(VALUE_WIDTHS, i)} />
          </Row>
        ))}
      </dl>
    </Panel>
  )
}

/** Turns a Zod field schema into an `InlineText` validator. */
const check = (schema: ZodType) => (text: string) => {
  const result = schema.safeParse(text)
  return result.success ? null : (result.error.issues[0]?.message ?? 'Check this value')
}
const validatePhone = check(saleSchema.shape.phone)
const validateEmail = check(saleSchema.shape.email)
const validateDocs = check(saleSchema.shape.docsLink)

const SOURCE_OPTIONS = SALE_SOURCES.map((s) => ({ value: s, label: s }))

/** The sale's details. Each one is edited in place and saved on its own; "Edit all" opens the full form. */
export function SaleAbout({ sale }: { sale: SaleView }) {
  const saleModal = useSaleModal()
  const { sellerOptions, courseOptions, rtoOptions } = useSaleOptions(sale)
  const createCourse = coursesApi.useCreateMutation()
  const patch = usePatchSaleMutation()
  const none = <span className="text-muted-foreground">—</span>

  const save = (fields: SalePatch) => patch.mutateAsync({ id: sale.id, patch: fields })
  /** For pickers: the change is already made, so a failure only needs the mutation's toast. */
  const pick = (fields: SalePatch) => void save(fields).catch(() => {})
  const saving = (field: keyof SalePatch) => patch.isPending && field in (patch.variables?.patch ?? {})

  return (
    <Panel className="pb-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">About this sale</h3>
        <Button variant="ghost" size="xs" onClick={() => saleModal.openEdit(sale.id)}>
          <PencilIcon />
          Edit all
        </Button>
      </div>

      <dl className="mt-1 divide-y">
        <Row icon={PhoneIcon} label="Phone" saving={saving('phone')}>
          <InlineText
            label="Phone"
            type="tel"
            copyable
            value={sale.phone}
            validate={validatePhone}
            onSave={(text) => save({ phone: text || null })}
            display={
              sale.phone && (
                <a href={`tel:${sale.phone.replace(/\s/g, '')}`} className={LINK}>
                  {sale.phone}
                </a>
              )
            }
          />
        </Row>
        <Row icon={MailIcon} label="Email" saving={saving('email')}>
          <InlineText
            label="Email"
            type="email"
            copyable
            value={sale.email}
            validate={validateEmail}
            onSave={(text) => save({ email: text || null })}
            display={
              sale.email && (
                <a href={`mailto:${sale.email}`} className={LINK}>
                  {sale.email}
                </a>
              )
            }
          />
        </Row>
        <Row icon={BookOpenIcon} label="Course" saving={saving('courseId')}>
          <Combobox
            aria-label="Course"
            value={sale.courseId}
            onChange={(courseId) => courseId !== sale.courseId && pick({ courseId })}
            options={courseOptions}
            searchPlaceholder="Search or add a course…"
            onCreate={(name) => createCourse.mutateAsync(name)}
            clearable
            className={INLINE_TRIGGER}
            trigger={<InlineTriggerContent>{sale.courseName ?? none}</InlineTriggerContent>}
          />
        </Row>
        <Row icon={LandmarkIcon} label="RTO" saving={saving('rtoId')}>
          <Combobox
            aria-label="RTO"
            value={sale.rtoId}
            onChange={(rtoId) => rtoId !== sale.rtoId && pick({ rtoId })}
            options={rtoOptions}
            clearable
            className={INLINE_TRIGGER}
            trigger={<InlineTriggerContent>{sale.rtoName ?? none}</InlineTriggerContent>}
          />
        </Row>
        <Row icon={UserIcon} label="Sold by" saving={saving('sellerId')}>
          <Combobox
            aria-label="Sold by"
            value={sale.sellerId}
            onChange={(sellerId) => sellerId && sellerId !== sale.sellerId && pick({ sellerId })}
            options={sellerOptions}
            className={INLINE_TRIGGER}
            trigger={<InlineTriggerContent>{sale.sellerName}</InlineTriggerContent>}
          />
        </Row>
        <Row icon={CalendarIcon} label="Sale date" saving={saving('saleDate')}>
          <DatePicker
            aria-label="Sale date"
            value={sale.saleDate}
            onChange={(saleDate) => saleDate && saleDate !== sale.saleDate && pick({ saleDate })}
            className={INLINE_TRIGGER}
            trigger={<InlineTriggerContent>{formatDate(sale.saleDate)}</InlineTriggerContent>}
          />
        </Row>
        {sale.completedOn && (
          <Row icon={CircleCheckBigIcon} label="Completed">
            {formatDate(sale.completedOn)}
          </Row>
        )}
        <Row icon={MegaphoneIcon} label="Source" saving={saving('source')}>
          <Combobox
            aria-label="Source"
            value={sale.source}
            onChange={(source) => source && source !== sale.source && pick({ source: source as SaleSource })}
            options={SOURCE_OPTIONS}
            className={INLINE_TRIGGER}
            trigger={<InlineTriggerContent>{sale.source}</InlineTriggerContent>}
          />
        </Row>
        {sale.referralCommission > 0 && (
          <Row icon={HandCoinsIcon} label="Referral commission">
            <span className="money">{formatAudShort(sale.referralCommission)}</span>
          </Row>
        )}
        <Row icon={ExternalLinkIcon} label="Documents" saving={saving('docsLink')}>
          <InlineText
            label="Documents link"
            type="url"
            value={sale.docsLink}
            placeholder="https://"
            validate={validateDocs}
            onSave={(text) => save({ docsLink: text || null })}
            display={
              sale.docsLink && (
                <a href={sale.docsLink} target="_blank" rel="noreferrer" className={LINK}>
                  Open documents
                </a>
              )
            }
          />
        </Row>
      </dl>

      {sale.notes && (
        <p className="mt-2 mb-2 rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap">
          <span className="mb-0.5 block text-[11px] font-bold tracking-wider text-muted-foreground uppercase">From the sale form</span>
          {sale.notes}
        </p>
      )}
    </Panel>
  )
}
