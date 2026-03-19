import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-xl border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        // Default — subtle dark surface
        default:
          "bg-[#18181f] border-[#222230] text-[#f0f0f5]",

        // Info — purple tinted
        info:
          "bg-[rgba(108,99,255,0.08)] border-[rgba(108,99,255,0.25)] text-[#6c63ff] [&>svg]:text-[#6c63ff]",

        // Success — green tinted (price drop alerts)
        success:
          "bg-[rgba(34,197,94,0.08)] border-[rgba(34,197,94,0.25)] text-[#22c55e] [&>svg]:text-[#22c55e] *:data-[slot=alert-description]:text-[rgba(34,197,94,0.8)]",

        // Destructive — red tinted
        destructive:
          "bg-[rgba(244,63,94,0.08)] border-[rgba(244,63,94,0.25)] text-[#f43f5e] [&>svg]:text-[#f43f5e] *:data-[slot=alert-description]:text-[rgba(244,63,94,0.8)]",

        // Warning — amber tinted (target price)
        warning:
          "bg-[rgba(245,158,11,0.08)] border-[rgba(245,158,11,0.25)] text-[#f59e0b] [&>svg]:text-[#f59e0b] *:data-[slot=alert-description]:text-[rgba(245,158,11,0.8)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({ className, variant, ...props }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm text-[#888899] [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }