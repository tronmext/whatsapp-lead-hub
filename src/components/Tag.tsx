import type { Tag } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const COLORS: Record<Tag["color"], string> = {
  orange: "border-orange-10/30 text-orange-10 bg-orange-10/[0.08]",
  green: "border-green-4/30 text-green-4 bg-green-4/[0.08]",
  blue: "border-blue-10/30 text-blue-10 bg-blue-10/[0.08]",
  yellow: "border-yellow-9/30 text-yellow-9 bg-yellow-9/[0.08]",
  red: "border-red-5/30 text-red-5 bg-red-5/[0.08]",
};

export function TagPill({ tag, className = "" }: { tag: Tag; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.05em] transition-all",
        COLORS[tag.color],
        className
      )}
    >
      <span className="size-1 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
      {tag.label}
    </span>
  );
}
