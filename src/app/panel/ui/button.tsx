import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#407516] text-white shadow-md shadow-[#407516]/30 hover:shadow-lg hover:shadow-[#407516]/40 hover:brightness-110",
        destructive:
          "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 hover:border-rose-300",
        outline:
          "border-2 border-[#407516]/30 bg-white/80 text-foreground hover:bg-[#407516]/10 hover:border-[#407516]/50 hover:shadow-sm",
        secondary:
          "bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100 hover:border-pink-300",
        ghost: "hover:bg-[#407516]/10 hover:text-foreground rounded-xl",
        link: "text-[#407516] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        xs: "h-7 gap-1 rounded-xl px-3 text-xs",
        sm: "h-9 gap-1.5 rounded-xl px-4 text-sm",
        lg: "h-12 gap-2 rounded-2xl px-6 text-base",
        icon: "h-10 w-10 rounded-xl",
        "icon-xs": "h-7 w-7 rounded-lg",
        "icon-sm": "h-8 w-8 rounded-xl",
        "icon-lg": "h-11 w-11 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
