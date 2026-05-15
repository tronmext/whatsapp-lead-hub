import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "standard" | "large" | "section";
  style?: React.CSSProperties;
}

export const ResendCard = ({ children, className, variant = "standard", style }: CardProps) => {
  const radius = {
    standard: "rounded-[16px]",
    large: "rounded-[24px]",
    section: "rounded-[32px]",
  }[variant];

  return (
    <div 
      className={cn(
        "frost-border bg-white/[0.01] backdrop-blur-sm transition-all duration-500 hover:bg-white/[0.03]",
        radius,
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
};
