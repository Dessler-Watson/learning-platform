import * as React from "react"

import { cn } from "../utils"

export type CardVariant = 'default' | 'cyan' | 'emerald' | 'violet' | 'amber' | 'rose' | 'pink' | 'blue' | 'orange';

const variantStyles: Record<CardVariant, string> = {
  default: "border-gray-100 hover:shadow-soft hover:border-gray-200",
  cyan: "border-[#407516]/40 hover:shadow-sm hover:border-[#407516]/60",
  emerald: "border-emerald-200 hover:shadow-glow-emerald hover:border-emerald-300",
  violet: "border-violet-200 hover:shadow-glow-violet hover:border-violet-300",
  amber: "border-amber-200 hover:shadow-glow-amber hover:border-amber-300",
  rose: "border-rose-200 hover:shadow-glow-rose hover:border-rose-300",
  pink: "border-pink-200 hover:shadow-glow-pink hover:border-pink-300",
  blue: "border-blue-200 hover:shadow-glow-blue hover:border-blue-300",
  orange: "border-orange-200 hover:shadow-glow-orange hover:border-orange-300",
};

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-3xl border bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-300 card-shimmer card-corner-decoration",
      variantStyles[variant],
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6 pb-2", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xl font-bold tracking-tight text-foreground", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
