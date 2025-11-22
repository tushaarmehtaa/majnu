import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] active:translate-y-[1px] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 font-display tracking-wider uppercase",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 font-display tracking-wider uppercase",
        outline:
          "border-2 border-primary bg-transparent shadow-sm hover:bg-primary/10 hover:text-primary font-display tracking-widest uppercase",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 font-display tracking-wider uppercase",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        stamp:
          "border-4 border-primary text-primary font-display text-lg tracking-[0.2em] uppercase rotate-[-2deg] hover:rotate-0 hover:scale-105 transition-transform duration-300 mask-image:url('/noise.svg')",
        paper:
          "bg-card text-card-foreground shadow-md hover:shadow-lg border border-border/50 font-mono relative overflow-hidden before:absolute before:inset-0 before:bg-[url('/paper-texture.svg')] before:opacity-50 before:mix-blend-multiply",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
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
