export function BrandMark({
  className = "",
  size = 22,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="currentColor" />
      <path
        d="M16 7.5L24.5 16L16 24.5L7.5 16L16 7.5Z"
        stroke="#fbfbf9"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
