export const CorrectIcon = () => (
  <svg
    width="256"
    height="256"
    viewBox="0 0 256 256"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="정답 아이콘"
    className="qti-ext-feedback-icon-correct qti-ext-feedback-badge-img"
  >
    <defs>
      <pattern id="pencilDenseCorrect" patternUnits="userSpaceOnUse" width="2" height="2">
        <path d="M0 2 L2 0" stroke="#cc0000" strokeWidth="1.6" opacity="0.95" />
        <path d="M-0.5 2 L1.5 0" stroke="#cc0000" strokeWidth="1.4" opacity="0.9" />
        <path d="M0.8 2 L2.8 0" stroke="#cc0000" strokeWidth="1.3" opacity="0.85" />
        <path d="M0 1 L2 1" stroke="#cc0000" strokeWidth="1.2" opacity="0.8" />
        <path d="M1 0 L1 2" stroke="#cc0000" strokeWidth="1.1" opacity="0.75" />
        <path d="M0.2 1.8 L1.8 0.2" stroke="#cc0000" strokeWidth="1" opacity="0.7" />
      </pattern>
      <filter id="bleedLightCorrect">
        <feGaussianBlur stdDeviation="0.25" />
      </filter>
      <filter id="edgeRoughCorrect">
        <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="2" seed="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5.5" />
      </filter>
    </defs>
    <circle
      cx="128"
      cy="128"
      r="108"
      fill="none"
      stroke="#cc0000"
      strokeWidth="22"
      strokeLinecap="round"
      opacity="0.1"
      filter="url(#bleedLightCorrect)"
    />
    <circle
      cx="128"
      cy="128"
      r="108"
      fill="none"
      stroke="url(#pencilDenseCorrect)"
      strokeWidth="20"
      strokeLinecap="round"
      filter="url(#edgeRoughCorrect)"
    />
  </svg>
);
