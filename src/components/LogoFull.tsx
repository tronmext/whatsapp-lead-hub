import logoSvg from "@/assets/logo-full.svg?raw";

export function LogoFull({ className }: { className?: string }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: logoSvg }}
    />
  );
}
