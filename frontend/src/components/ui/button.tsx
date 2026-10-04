import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:brightness-110",
        destructive:
          "bg-red-500/80 text-white backdrop-blur-sm hover:bg-red-500",
        outline:
          "border border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 hover:border-white/30",
        secondary:
          "bg-white/10 text-white backdrop-blur-sm hover:bg-white/15",
        ghost: "text-white/70 hover:bg-white/10 hover:text-white",
        link: "text-violet-300 underline-offset-4 hover:underline",
        glass: "border border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/10 hover:border-white/25",
        gradient: "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 text-white shadow-lg shadow-fuchsia-500/30 hover:brightness-110 hover:shadow-fuchsia-500/50",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
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
