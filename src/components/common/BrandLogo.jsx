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
    <span className={classes}>
      <img
        src="/onair-studio-ai-logo.png"
        alt="OnAir Studio IA"
      />
    </span>
  );
}

export default BrandLogo;