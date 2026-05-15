import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "standard" | "large" | "section";
  style?: React.CSSProperties;
}

export const ResendCard = ({ children, className, variant = "standard", style }: CardProps) => {
  const radius = {
    standard: "rounded-[var(--radius-card)]",
    large: "rounded-[24px]",
    section: "rounded-[32px]",
  }[variant];

  return (
    <div 
      className={cn(
        "border border-border bg-card text-card-foreground transition-all duration-500 hover:bg-white/[0.03]",
        radius,
        className
      )}
      style={{
        boxShadow: "var(--card-shadow)",
        ...style
      }}
    >
      {children}
    </div>
  );
};
