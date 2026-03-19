import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[rgba(108,99,255,0.4)]",
  {
    variants: {
      variant: {
        // Primary — accent purple
        default:
          "bg-[#6c63ff] text-white hover:opacity-85 active:scale-[0.98]",

        // Destructive — red
        destructive:
          "bg-[#f43f5e] text-white hover:opacity-85 active:scale-[0.98]",

        // Outline — dark bordered
        outline:
          "border border-[#2a2a3a] bg-transparent text-[#888899] hover:border-[#6c63ff] hover:text-[#f0f0f5] active:scale-[0.98]",

        // Secondary — subtle dark surface
        secondary:
          "bg-[#18181f] text-[#f0f0f5] border border-[#222230] hover:border-[#2a2a3a] hover:bg-[#222230] active:scale-[0.98]",

        // Ghost — no border, hover reveals bg
        ghost:
          "bg-transparent text-[#888899] hover:bg-[#18181f] hover:text-[#f0f0f5]",

        // Link — accent colored underline
        link:
          "text-[#6c63ff] underline-offset-4 hover:underline p-0 h-auto",

        // Success — green for confirmations
        success:
          "bg-[#22c55e] text-white hover:opacity-85 active:scale-[0.98]",
      },
      size: {
        default:   "h-9 px-4 py-2 has-[>svg]:px-3",
        sm:        "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg:        "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon:      "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
)

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }