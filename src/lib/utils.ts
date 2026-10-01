import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Rough token estimate (~4 chars / token). */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function formatTokens(n: number): string {
  return Math.round(n).toLocaleString();
}

export function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(1)}%`;
}
