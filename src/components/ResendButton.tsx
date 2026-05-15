import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

export const ResendButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = "secondary", size = "md", icon, className, ...props }, ref) => {
    const variants = {
      primary: "bg-near-white text-void hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]",
      secondary: "bg-transparent text-near-white frost-border hover:bg-white/[0.28]",
      ghost: "bg-transparent text-near-white hover:bg-white/[0.05] border-none",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-[12px]",
      md: "px-5 py-2.5 text-[14px]",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "pill font-sans font-semibold transition-all active:scale-95 flex items-center justify-center gap-2",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
        {icon}
      </button>
    );
  }
);

ResendButton.displayName = "ResendButton";
