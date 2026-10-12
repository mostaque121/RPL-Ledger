import { SearchIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  id?: string
  className?: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}

export function SearchInput({ id, className, value, onChange, placeholder, label }: SearchInputProps) {
  return (
    <div className={cn('relative w-full sm:w-64', className)}>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="pl-8"
      />
    </div>
  )
}
