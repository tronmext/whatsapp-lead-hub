import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold uppercase tracking-widest cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-near-white/20 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-near-white text-void hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02]",
        destructive: "bg-red-5 text-near-white shadow-sm hover:bg-red-5/90",
        outline:
          "border border-frost-border bg-transparent text-near-white hover:bg-white/[0.05]",
        secondary: "bg-white/[0.05] text-near-white border border-frost-border hover:bg-white/[0.1]",
        ghost: "hover:bg-white/[0.05] text-near-white",
        link: "text-near-white underline-offset-4 hover:underline",
        premium: "bg-gradient-to-br from-near-white to-near-white/80 text-void hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.03]",
      },
      size: {
        default: "pill h-10 px-6",
        sm: "pill h-8 px-4 text-[10px]",
        lg: "pill h-12 px-10 text-base",
        icon: "rounded-xl h-10 w-10",
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
