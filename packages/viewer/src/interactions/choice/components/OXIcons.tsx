interface OXIconProps {
  className?: string;
}

export function OCircleIcon({ className }: OXIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="O"
    >
      <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="5" />
    </svg>
  );
}

export function XMarkIcon({ className }: OXIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="X"
    >
      <line
        x1="8"
        y1="8"
        x2="40"
        y2="40"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line
        x1="40"
        y1="8"
        x2="8"
        y2="40"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
