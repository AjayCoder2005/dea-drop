import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        // Purple accent — default
        default:
          "border-transparent bg-[rgba(108,99,255,0.15)] text-[#6c63ff]",

        // Muted dark surface
        secondary:
          "border-[#2a2a3a] bg-[#18181f] text-[#888899]",

        // Red — errors / destructive
        destructive:
          "border-transparent bg-[rgba(244,63,94,0.15)] text-[#f43f5e]",

        // Green — success / price drop
        success:
          "border-transparent bg-[rgba(34,197,94,0.12)] text-[#22c55e]",

        // Amber — warnings / target price
        warning:
          "border-transparent bg-[rgba(245,158,11,0.12)] text-[#f59e0b]",

        // Outlined — subtle border only
        outline:
          "border-[#2a2a3a] bg-transparent text-[#888899]",

        // Live indicator
        live:
          "border-transparent bg-[rgba(34,197,94,0.12)] text-[#22c55e] font-semibold tracking-wide",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "span"
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }