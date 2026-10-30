/** Логотип-радиант (2D-версия 3D-кристалла): ядро + додекаэдрическая решётка + орбита */
export function RadiantMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      <circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.8" />
      <g fill="none" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round">
        <path d="M20 6 L33 15.5 L28 30.5 L12 30.5 L7 15.5 Z" strokeOpacity="0.8" />
        <path d="M20 6 L20 13 M33 15.5 L26.6 17.8 M28 30.5 L24 25 M12 30.5 L16 25 M7 15.5 L13.4 17.8" strokeOpacity="0.5" />
        <path d="M20 13 L26.6 17.8 L24 25 L16 25 L13.4 17.8 Z" strokeOpacity="0.65" />
      </g>
      <circle cx="20" cy="19.5" r="3.2" fill="var(--sun)" />
    </svg>
  );
}
