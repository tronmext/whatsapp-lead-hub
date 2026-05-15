import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const HeadingHero = ({ children, className, as: Component = "h1" }: TypographyProps) => (
  <Component className={cn("font-display text-[96px] text-near-white", className)}>
    {children}
  </Component>
);

export const HeadingSection = ({ children, className, as: Component = "h2" }: TypographyProps) => (
  <Component className={cn("font-section text-[56px] text-near-white", className)}>
    {children}
  </Component>
);

export const HeadingSub = ({ children, className, as: Component = "h3" }: TypographyProps) => (
  <Component className={cn("font-section text-[20px] text-near-white tracking-[0.35px] uppercase", className)}>
    {children}
  </Component>
);

export const TextBody = ({ children, className, as: Component = "p" }: TypographyProps) => (
  <Component className={cn("font-sans text-[16px] leading-[1.5] text-near-white/80", className)}>
    {children}
  </Component>
);

export const TextSmall = ({ children, className, as: Component = "span" }: TypographyProps) => (
  <Component className={cn("text-[12px] font-sans text-muted-foreground uppercase tracking-[0.08em] font-semibold", className)}>
    {children}
  </Component>
);

export const TextMono = ({ children, className, as: Component = "span" }: TypographyProps) => (
  <Component className={cn("text-[13px] font-mono font-medium text-muted-foreground", className)}>
    {children}
  </Component>
);
