import logoSvg from "@/assets/logo-icon.svg?raw";

export function LogoIcon({ className }: { className?: string }) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: logoSvg }}
    />
  );
}
