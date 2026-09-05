import * as React from "react"

import { cn } from "../utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 min-w-0 w-full rounded-2xl border-2 border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-all duration-200 placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-[#407516] focus-visible:ring-2 focus-visible:ring-[#407516]/15 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
