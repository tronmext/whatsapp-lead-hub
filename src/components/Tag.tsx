import type { Tag } from "@/lib/mock-data";
import { TAG_COLOR_CLASSES } from "@/lib/mock-data";

export function TagPill({ tag, className = "" }: { tag: Tag; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${TAG_COLOR_CLASSES[tag.color]} ${className}`}
    >
      <span className="size-1 rounded-full bg-current opacity-70" />
      {tag.label}
    </span>
  );
}
