import Link from "next/link";
import { BrandMark } from "@/components/brand/mark";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--paper)] px-6 text-[var(--ink)]">
      <Link href="/" className="op-mark mb-10 inline-flex items-center gap-2.5 text-[18px]">
        <BrandMark size={22} />
        OpenPages
      </Link>
      <p className="text-[10px] font-medium tracking-[0.14em] text-[var(--ink-faint)]">
        404
      </p>
      <h1 className="op-display mt-3 text-[clamp(2rem,5vw,3rem)]">
        This page isn&apos;t here
      </h1>
      <p className="mt-4 max-w-sm text-center text-[15px] leading-relaxed text-[var(--ink-muted)]">
        The Space or page may have moved. Head home or open your Spaces.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-[14px] text-[var(--paper)]"
        >
          Home
        </Link>
        <Link
          href="/spaces"
          className="inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white px-5 py-2.5 text-[14px] text-[var(--ink)]"
        >
          Spaces
        </Link>
      </div>
    </div>
  );
}
