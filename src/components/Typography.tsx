import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const HeadingHero = ({ children, className, as: Component = "h1" }: TypographyProps) => (
  <Component className={cn("font-display text-[96px] text-foreground leading-[0.9] tracking-[-0.04em] font-feature-ss01-ss04-ss11", className)}>
    {children}
  </Component>
);

export const HeadingSection = ({ children, className, as: Component = "h2" }: TypographyProps) => (
  <Component className={cn("font-section text-[56px] text-foreground leading-[1.1] tracking-[-0.03em] font-feature-ss01-ss04-ss11", className)}>
    {children}
  </Component>
);

export const HeadingSub = ({ children, className, as: Component = "h3" }: TypographyProps) => (
  <Component className={cn("font-section text-[20px] text-foreground tracking-[0.02em] uppercase font-feature-ss01-ss04-ss11", className)}>
    {children}
  </Component>
);

export const TextBody = ({ children, className, as: Component = "p" }: TypographyProps) => (
  <Component className={cn("font-sans text-[var(--text-body)] leading-[var(--leading-body)] text-foreground/70 antialiased", className)}>
    {children}
  </Component>
);

export const TextSmall = ({ children, className, as: Component = "span" }: TypographyProps) => (
  <Component className={cn("text-[11px] font-mono text-muted-foreground uppercase tracking-[0.2em] font-black", className)}>
    {children}
  </Component>
);

export const TextMono = ({ children, className, as: Component = "span" }: TypographyProps) => (
  <Component className={cn("font-mono text-[13px] font-medium text-muted-foreground/60 tracking-tight", className)}>
    {children}
  </Component>
);
