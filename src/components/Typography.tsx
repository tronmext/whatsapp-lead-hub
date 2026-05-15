import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const HeadingHero = ({ children, className, as: Component = "h1" }: TypographyProps) => (
  <Component className={cn("text-[96px] leading-[1.0] font-display text-near-white tracking-[-0.04em]", className)}>
    {children}
  </Component>
);

export const HeadingSection = ({ children, className, as: Component = "h2" }: TypographyProps) => (
  <Component className={cn("text-[56px] leading-[1.2] font-section text-near-white tracking-[-0.05em]", className)}>
    {children}
  </Component>
);

export const HeadingSub = ({ children, className, as: Component = "h3" }: TypographyProps) => (
  <Component className={cn("text-[20px] font-section text-near-white tracking-[0.35px]", className)}>
    {children}
  </Component>
);

export const TextBody = ({ children, className, as: Component = "p" }: TypographyProps) => (
  <Component className={cn("text-[16px] leading-[1.5] text-near-white font-sans", className)}>
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
