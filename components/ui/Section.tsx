import type { ReactNode } from "react";

/** A titled card. The eyebrow says what question the section answers. */
export function Section({
  eyebrow,
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={`card ${className}`}>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule px-5 py-4 sm:px-6">
        <div>
          {eyebrow ? <p className="eyebrow mb-1.5">{eyebrow}</p> : null}
          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h2>
        </div>
        {action}
      </header>
      <div className={`px-5 py-5 sm:px-6 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
