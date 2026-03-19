import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-lg border border-[#2a2a3a] bg-[#18181f] px-3 py-1 text-sm text-[#f0f0f5]",
        "placeholder:text-[#555566] outline-none transition-all duration-200",
        "focus:border-[#6c63ff] focus:ring-2 focus:ring-[rgba(108,99,255,0.2)]",
        "disabled:pointer-events-none disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#f0f0f5]",
        className
      )}
      {...props}
    />
  )
}

export { Input }