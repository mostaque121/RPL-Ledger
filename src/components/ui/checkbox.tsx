import * as React from "react"
import { CheckIcon } from "lucide-react"
import { cn } from "cn"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer grid size-[18px] shrink-0 place-items-center rounded-[5px] border-2 border-input bg-card transition-colors outline-none hover:border-primary focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive data-[state=checked]:border-success data-[state=checked]:bg-success data-[state=checked]:text-success-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-items-center">
        <CheckIcon className="size-3.5" strokeWidth={3.5} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
