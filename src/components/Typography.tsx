import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const HeadingHero = ({ children, className, as: Component = "h1" }: TypographyProps) => (
  <Component className={cn("font-display text-[96px] text-foreground leading-[1.0] tracking-[-0.96px]", className)}>
    {children}
  </Component>
);

export const HeadingSection = ({ children, className, as: Component = "h2" }: TypographyProps) => (
  <Component className={cn("font-section text-[56px] text-foreground leading-[1.2] tracking-[-2.8px]", className)}>
    {children}
  </Component>
);

export const HeadingSub = ({ children, className, as: Component = "h3" }: TypographyProps) => (
  <Component className={cn("font-section text-[20px] text-foreground tracking-[0.35px] uppercase", className)}>
    {children}
  </Component>
);

export const TextBody = ({ children, className, as: Component = "p" }: TypographyProps) => (
  <Component className={cn("font-sans text-[var(--text-body)] leading-[var(--leading-body)] text-foreground/80", className)}>
    {children}
  </Component>
);

export const TextSmall = ({ children, className, as: Component = "span" }: TypographyProps) => (
  <Component className={cn("text-[12px] font-sans text-muted-foreground uppercase tracking-[0.08em] font-semibold", className)}>
    {children}
  </Component>
);

export const TextMono = ({ children, className, as: Component = "span" }: TypographyProps) => (
  <Component className={cn("font-mono text-[13px] font-medium text-muted-foreground", className)}>
    {children}
  </Component>
);
