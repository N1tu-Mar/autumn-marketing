"use client";

import { LoadFailure } from "@/components/ui/LoadFailure";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return <LoadFailure reset={reset} />;
}
