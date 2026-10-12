import { profitSplit, saleProfit, type SellerKind, type Settings } from '@/lib/accounting'
import { formatAud } from '@/lib/format'
import type { Cents } from '@/lib/money'
import { cn } from '@/lib/utils'

interface SalePreviewProps {
  courseFee: Cents
  rtoCost: Cents
  referralCommission: Cents
  /** Null until a seller is picked. */
  seller: SellerKind | null
  sellerName?: string
  settings: Settings
}

/** Live profit → tax → net → who gets what, as the form is filled in. */
export function SalePreview({ courseFee, rtoCost, referralCommission, seller, sellerName, settings }: SalePreviewProps) {
  const { profit, tax, netProfit } = saleProfit({ courseFee, rtoCost, referralCommission }, settings)
  const split = seller ? profitSplit(seller, netProfit, settings) : null

  const lines = [
    { label: 'Course fee', value: courseFee, tone: '' },
    { label: 'RTO cost', value: -rtoCost, tone: 'text-danger' },
    ...(referralCommission ? [{ label: 'Referral', value: -referralCommission, tone: 'text-danger' }] : []),
  ]

  return (
    <div>
      <dl className="space-y-1.5 text-sm">
        {lines.map((l) => (
          <Line key={l.label} label={l.label} value={l.value} tone={l.tone} />
        ))}
        <div className="border-t pt-1.5">
          <Line label="Profit" value={profit} tone={cn('font-bold', profit < 0 && 'text-danger')} />
        </div>
        <Line label={`Tax ${settings.taxPct}%`} value={-tax} tone="text-danger" />
        <div className="rounded-lg bg-muted px-3 py-2">
          <Line label="Net profit" value={netProfit} tone={cn('text-base font-extrabold', netProfit < 0 ? 'text-danger' : 'text-success')} />
        </div>
      </dl>

      {profit < 0 && <p className="mt-2 text-xs font-semibold text-danger">This sale loses money.</p>}

      <div className="mt-5 border-t pt-4">
        <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Who gets it</p>
        {split ? (
          <>
            {seller === 'employee' && (
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-secondary" aria-hidden>
                <div className="bg-primary" style={{ width: `${settings.tanvirShare}%` }} />
                <div className="bg-info" style={{ width: `${100 - settings.tanvirShare}%` }} />
              </div>
            )}
            <div className="mt-2 space-y-1 text-sm">
              <Partner name="Tanvir" dot="bg-primary" amount={split.tanvir} />
              <Partner name="MD" dot="bg-info" amount={split.md} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {seller === 'employee'
                ? `${sellerName ?? 'Employee'} sale: net split ${settings.tanvirShare}/${100 - settings.tanvirShare}. Counts when completed.`
                : 'Own sale: all of the net goes to the seller. Counts when completed.'}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Pick the seller to see the split.</p>
        )}
      </div>
    </div>
  )
}

function Line({ label, value, tone }: { label: string; value: Cents; tone: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('money', tone)}>{formatAud(value)}</dd>
    </div>
  )
}

function Partner({ name, dot, amount }: { name: string; dot: string; amount: Cents }) {
  return (
    <div className={cn('flex items-center justify-between', amount === 0 && 'opacity-50')}>
      <span className="flex items-center gap-1.5">
        <span className={cn('size-2 rounded-full', dot)} />
        {name}
      </span>
      <span className="money font-bold">{formatAud(amount)}</span>
    </div>
  )
}
