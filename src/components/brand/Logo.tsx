import logoUrl from '@/assets/logo.png'
import { cn } from '@/lib/utils'

/** App mark: the open-book logo (also the favicon). */
export function LogoMark({ className }: { className?: string }) {
  return <img src={logoUrl} alt="" aria-hidden className={cn('size-8 shrink-0 object-contain', className)} />
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-tight">RPL Ledger</span>
        <span className="block text-[11px] font-medium opacity-70">Accounts &amp; profit</span>
      </span>
    </span>
  )
}
