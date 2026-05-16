import { cn } from "@/lib/utils";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const HeadingHero = ({ children, className, as: Component = "h1" }: TypographyProps) => (
  <Component
    className={cn(
      "font-display text-[var(--text-4xl)] md:text-[var(--text-6xl)] text-foreground leading-tight tracking-tighter",
      className,
    )}
  >
    {children}
  </Component>
);

export const HeadingSection = ({ children, className, as: Component = "h2" }: TypographyProps) => (
  <Component
    className={cn(
      "font-display text-[var(--text-3xl)] md:text-[var(--text-4xl)] text-foreground leading-tight tracking-tight",
      className,
    )}
  >
    {children}
  </Component>
);

export const HeadingSub = ({ children, className, as: Component = "h3" }: TypographyProps) => (
  <Component
    className={cn(
      "font-ui text-[var(--text-lg)] text-foreground font-semibold leading-snug",
      className,
    )}
  >
    {children}
  </Component>
);

export const TextBody = ({ children, className, as: Component = "p" }: TypographyProps) => (
  <Component
    className={cn(
      "font-body text-[var(--text-base)] leading-[var(--leading-relaxed)] text-foreground/90",
      className,
    )}
  >
    {children}
  </Component>
);

export const TextSmall = ({ children, className, as: Component = "span" }: TypographyProps) => (
  <Component
    className={cn("font-ui text-[var(--text-sm)] text-muted-foreground leading-normal", className)}
  >
    {children}
  </Component>
);

export const TextMono = ({ children, className, as: Component = "span" }: TypographyProps) => (
  <Component
    className={cn(
      "font-mono text-[var(--text-xs)] text-muted-foreground/80 tracking-normal",
      className,
    )}
  >
    {children}
  </Component>
);
