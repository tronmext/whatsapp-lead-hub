import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground btn-glow-default",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-frost-border bg-transparent text-foreground hover:bg-white/[0.04]",
        secondary:
          "bg-white/[0.05] text-foreground border border-frost-border hover:bg-white/[0.08]",
        ghost: "hover:bg-white/[0.04] text-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        premium: "bg-primary text-primary-foreground btn-glow-premium",
      },
      size: {
        default: "h-[var(--btn-height)] px-6 rounded-[var(--radius-button)]",
        sm: "h-8 px-4 text-[10px] rounded-[var(--radius-button)]",
        lg: "h-12 px-10 text-base rounded-[var(--radius-button)]",
        icon: "h-[var(--btn-height)] w-[var(--btn-height)] rounded-[var(--radius-button)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
