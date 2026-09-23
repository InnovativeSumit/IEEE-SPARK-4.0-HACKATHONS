import { useRef, useState, ReactNode, MouseEvent } from "react";

export default function TiltCard({
  children, className = "", maxTilt = 8, glare = true,
}: {
  children: ReactNode; className?: string; maxTilt?: number; glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * maxTilt * 2;
    const rotateX = (0.5 - py) * maxTilt * 2;
    setStyle({
      transform: `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(6px)`,
      transition: "transform 60ms linear",
    });
    setGlarePos({ x: px * 100, y: py * 100, opacity: 0.12 });
  };

  const onMouseLeave = () => {
    setStyle({ transform: "perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)", transition: "transform 350ms cubic-bezier(.22,1,.36,1)" });
    setGlarePos((g) => ({ ...g, opacity: 0 }));
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ ...style, transformStyle: "preserve-3d" }}
      className={`relative will-change-transform ${className}`}
    >
      {children}
      {glare && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}), transparent 55%)`,
            transition: "opacity 200ms ease",
          }}
        />
      )}
    </div>
  );
}
