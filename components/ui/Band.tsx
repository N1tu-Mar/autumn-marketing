import type { ReactNode } from "react";

/**
 * An open section on the page ground. Grouping comes from a heading, spacing
 * and one hairline — not from another rectangle.
 */
export function Band({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[22px] font-semibold tracking-[-0.015em] text-ink sm:text-[24px]">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
