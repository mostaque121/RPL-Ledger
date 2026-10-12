import type { ReactNode } from 'react'
import {
  BookOpenIcon,
  CalendarIcon,
  CircleCheckBigIcon,
  ExternalLinkIcon,
  HandCoinsIcon,
  LandmarkIcon,
  MailIcon,
  MegaphoneIcon,
  PencilIcon,
  PhoneIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react'
import { pickWidth } from '@/components/feedback/skeleton-widths'
import { SkeletonText } from '@/components/feedback/SkeletonText'
import { Button } from '@/components/ui/button'
import { formatAudShort, formatDate } from '@/lib/format'
import type { SaleView } from '../../api/sales'
import { useSaleModal } from '../../hooks/use-sale-modal'
import { Panel } from './Panel'

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{label}</dt>
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
          Edit
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

/** The sale's details, read-only, with a shortcut to edit them. */
export function SaleAbout({ sale }: { sale: SaleView }) {
  const saleModal = useSaleModal()
  const none = <span className="text-muted-foreground">—</span>

  return (
    <Panel className="pb-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">About this sale</h3>
        <Button variant="ghost" size="xs" onClick={() => saleModal.openEdit(sale.id)}>
          <PencilIcon />
          Edit
        </Button>
      </div>

      <dl className="mt-1 divide-y">
        <Row icon={PhoneIcon} label="Phone">
          {sale.phone ? (
            <a href={`tel:${sale.phone.replace(/\s/g, '')}`} className={LINK}>
              {sale.phone}
            </a>
          ) : (
            none
          )}
        </Row>
        <Row icon={MailIcon} label="Email">
          {sale.email ? (
            <a href={`mailto:${sale.email}`} className={LINK}>
              {sale.email}
            </a>
          ) : (
            none
          )}
        </Row>
        <Row icon={BookOpenIcon} label="Course">
          {sale.courseName ?? none}
        </Row>
        <Row icon={LandmarkIcon} label="RTO">
          {sale.rtoName ?? none}
        </Row>
        <Row icon={UserIcon} label="Sold by">
          {sale.sellerName}
        </Row>
        <Row icon={CalendarIcon} label="Sale date">
          {formatDate(sale.saleDate)}
        </Row>
        {sale.completedOn && (
          <Row icon={CircleCheckBigIcon} label="Completed">
            {formatDate(sale.completedOn)}
          </Row>
        )}
        <Row icon={MegaphoneIcon} label="Source">
          {sale.source}
        </Row>
        {sale.referralCommission > 0 && (
          <Row icon={HandCoinsIcon} label="Referral commission">
            <span className="money">{formatAudShort(sale.referralCommission)}</span>
          </Row>
        )}
        <Row icon={ExternalLinkIcon} label="Documents">
          {sale.docsLink ? (
            <a href={sale.docsLink} target="_blank" rel="noreferrer" className={LINK}>
              Open documents
            </a>
          ) : (
            none
          )}
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
