"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Soft-gate: first local run goes through /onboarding unless already complete
 * or credentials already exist via env.
 */
export default function SpacesRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/onboarding");
        const data = await res.json();
        if (cancelled) return;
        if (data.needsOnboarding) {
          router.replace("/onboarding");
          return;
        }
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] text-sm text-[var(--ink-faint)]">
        Loading…
      </div>
    );
  }

  return children;
}
