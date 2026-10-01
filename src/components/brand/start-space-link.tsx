"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

/** Header/CTA — onboarded users skip the wizard and go to Spaces. */
export function StartSpaceLink({
  className,
  children,
  iconSize = 18,
}: {
  className?: string;
  children: React.ReactNode;
  iconSize?: number;
}) {
  const [href, setHref] = useState("/onboarding");

  useEffect(() => {
    void fetch("/api/onboarding")
      .then((r) => r.json())
      .then((d) => {
        if (d && d.needsOnboarding === false) setHref("/spaces");
      })
      .catch(() => undefined);
  }, []);

  return (
    <Link className={className} href={href}>
      {children}
      <ArrowUpRight size={iconSize} />
    </Link>
  );
}
