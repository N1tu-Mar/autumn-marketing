import type { Property } from "@/types/database";

/**
 * Property identity, restrained.
 *
 * A photograph is used when the property row carries one. It usually does not,
 * and a stock travel image would say nothing true about this hotel — so the
 * fallback is a monogram drawn from the property's own name.
 */
export function PropertyMark({ property }: { property: Property }) {
  const initials = property.name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");

  if (property.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={property.image_url}
        alt=""
        className="h-11 w-11 shrink-0 rounded-[10px] object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="grid h-11 w-11 shrink-0 place-items-center rounded-[10px] bg-harbor-wash text-[15px] font-semibold tracking-[0.02em] text-harbor-deep"
    >
      {initials}
    </span>
  );
}
