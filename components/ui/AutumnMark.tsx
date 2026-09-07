/**
 * The Autumn wordmark is kept as a component rather than an image so it stays
 * sharp at every screen density and has a useful text alternative.
 */
export function AutumnMark({ className = "" }: { className?: string }) {
  return (
    <span
      aria-label="Autumn"
      className={`inline-flex items-center gap-2 text-ink ${className}`}
    >
      <svg
        aria-hidden="true"
        className="h-6 w-7 shrink-0"
        fill="none"
        viewBox="0 0 28 24"
      >
        <path
          d="M25.8 2.4C18.8.3 10.9 1.1 5.4 5.7c-2.8 2.3-4.4 5.1-4.8 8.2 4.9.8 9.2-.3 12.7-3.2 2.5-2.1 4.2-4.7 5.1-7.8-1.4 4.4-4.1 8.2-8.1 11.3-3.2 2.5-6.4 4.3-9.6 5.4l1.7 2.8c5.2-1.6 9.7-4 13.4-7.1 4.9-4 8.3-8.3 10-12.9Z"
          fill="currentColor"
        />
      </svg>
      <span className="font-[Arial,sans-serif] text-[29px] font-bold leading-none tracking-[-0.07em]">
        autumn
      </span>
    </span>
  );
}
