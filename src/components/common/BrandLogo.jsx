function BrandLogo({ className = "" }) {
  return (
    <img
      className={`brand-logo ${className}`.trim()}
      src="/onair-studio-ai-symbol.png"
      alt="OnAir Studio AI"
      draggable="false"
    />
  );
}

export default BrandLogo;