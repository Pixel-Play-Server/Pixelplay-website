function Cube({ className }: { className: string }) {
  const faces = ["front", "back", "right", "left", "top", "bottom"];
  return (
    <div className={`cube-container ${className}`}>
      <div className="cube-3d">
        {faces.map((f) => (
          <div key={f} className={`cube-face face-${f}`} />
        ))}
      </div>
    </div>
  );
}

export function PixelBackground() {
  return (
    <div className="bg-layer" aria-hidden>
      <div className="bg-grid" />
      <Cube className="cube-1" />
      <Cube className="cube-2" />
      <Cube className="cube-3" />
    </div>
  );
}
