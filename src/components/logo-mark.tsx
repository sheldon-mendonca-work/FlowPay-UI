export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fp-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="oklch(0.72 0.16 250)" />
          <stop offset="60%" stopColor="oklch(0.78 0.13 200)" />
          <stop offset="100%" stopColor="oklch(0.7 0.2 295)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#fp-g)" />
      <path
        d="M13 27 V13 H27 M13 20 H24"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="27" cy="27" r="2.2" fill="white" />
    </svg>
  );
}
