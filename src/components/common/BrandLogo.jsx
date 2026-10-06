function BrandLogo({
  compact = false,
  className = "",
}) {
  const classes = [
    "brand-logo",
    compact ? "brand-logo-compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} role="img" aria-label="OnAir Studio IA">
      <svg
        className="brand-logo-mark"
        viewBox="0 0 180 150"
        aria-hidden="true"
        focusable="false"
      >
        <path
          className="brand-logo-wave brand-logo-wave-outer"
          d="M55 20c10-7 22-10 35-10s25 3 35 10"
        />
        <path
          className="brand-logo-wave brand-logo-wave-middle"
          d="M66 34c7-5 15-7 24-7s17 2 24 7"
        />
        <path
          className="brand-logo-wave brand-logo-wave-inner"
          d="M77 47c4-3 8-4 13-4s9 1 13 4"
        />

        <path
          className="brand-logo-ring brand-logo-ring-left"
          d="M51 63a42 42 0 0 0 39 66"
        />
        <path
          className="brand-logo-ring brand-logo-ring-right"
          d="M90 129a42 42 0 0 0 39-66"
        />

        <path className="brand-logo-letter" d="m62 112 28-58 28 58" />
        <path className="brand-logo-letter-bar" d="M77 94h26" />

        <path
          className="brand-logo-beacon-sweep"
          d="m90 58 29-16c-7 11-17 17-29 16Z"
        />
        <circle className="brand-logo-beacon-glow" cx="90" cy="58" r="12" />
        <circle className="brand-logo-beacon-core" cx="90" cy="58" r="6.5" />
      </svg>

      <span className="brand-logo-wordmark" aria-hidden="true">
        <strong>ONAIR</strong>
        <span>STUDIO IA</span>
      </span>
    </span>
  );
}

export default BrandLogo;
