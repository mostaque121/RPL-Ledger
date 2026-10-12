import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Line box (the text's line-height) and bar height for each text size, so a placeholder takes the text's exact height. */
const SIZES = {
  '11px': ['h-4', 'h-2.5'],
  xs: ['h-4', 'h-3'],
  sm: ['h-5', 'h-3.5'],
  base: ['h-6', 'h-4'],
  lg: ['h-7', 'h-5'],
  xl: ['h-7', 'h-5'],
  '2xl': ['h-8', 'h-6'],
  '3xl': ['h-9', 'h-7'],
} as const

export type TextSize = keyof typeof SIZES

interface SkeletonTextProps {
  /** The Tailwind text size of the text it stands in for. */
  size?: TextSize
  /** Width of the bar, e.g. `w-24`. */
  className?: string
  align?: 'right'
}

/** A bar standing in for one line of text: same height as the line, so nothing moves when the text arrives. */
export function SkeletonText({ size = 'sm', className, align }: SkeletonTextProps) {
  const [box, bar] = SIZES[size]
  return (
    <div aria-hidden className={cn('flex items-center', box, align === 'right' && 'justify-end')}>
      <Skeleton className={cn(bar, 'w-24 rounded', className)} />
    </div>
  )
}

/** Wraps a loading area: announced once to screen readers, the bars themselves are hidden. */
export function LoadingRegion({ children, className, label = 'Loading' }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  )
}
