import type { WorkItem } from "@/content/work";

// A deliberately empty media stage. Real image/video can replace the surface
// later without changing the editorial layout or pretending placeholder art
// is project output in the meantime.
export function SystemVisual({
  item,
  label,
  className = "",
}: {
  item: WorkItem;
  label: string;
  className?: string;
}) {
  return (
    <figure
      data-media={item.visual}
      aria-label={`${item.title} — ${label}`}
      className={`media-stage ${className}`}
    />
  );
}
