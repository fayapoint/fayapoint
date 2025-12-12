"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { updateAttributionFromLocation } from "@/lib/attribution";

export function AttributionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const qs = searchParams?.toString();
    const href = qs ? `${window.location.origin}${pathname}?${qs}` : `${window.location.origin}${pathname}`;
    updateAttributionFromLocation({ href, referrer: document.referrer });
  }, [pathname, searchParams]);

  return null;
}
