import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "standard" | "large" | "section";
  bordered?: boolean;
  style?: React.CSSProperties;
}

export const ResendCard = ({
  children,
  className,
  variant = "standard",
  bordered = false,
  style,
}: CardProps) => {
  const radius = {
    standard: "rounded-[var(--radius-card)]",
    large: "rounded-[24px]",
    section: "rounded-[32px]",
  }[variant];

  return (
    <div
      className={cn(
        "border bg-card text-card-foreground transition-all duration-500",
        bordered ? "border-frost-border-strong" : "border-frost-border/60",
        "hover:bg-white/[0.02]",
        radius,
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
};
