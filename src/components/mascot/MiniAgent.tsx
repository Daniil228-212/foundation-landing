import { useId } from "react";
import type { AgentId } from "@/content/agents";

/**
 * Мини-агенты — та же семья, что и Фундик (тело-фасолина, хохолок, большие глаза),
 * но свой цвет и один отличительный аксессуар.
 */
export function MiniAgent({
  id,
  color,
  size = 56,
  dim = false,
  className,
}: {
  id: AgentId;
  color: string;
  size?: number;
  dim?: boolean;
  className?: string;
}) {
  const gid = `ma-${id}-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      aria-hidden
      style={{ filter: dim ? "grayscale(0.85) brightness(0.7)" : undefined }}
    >
      <defs>
        <radialGradient id={gid} cx="40%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="35%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </radialGradient>
      </defs>
      {/* хохолок */}
      <path d="M49 20 C 44 9, 52 3, 59 6 C 63 8, 62 13, 58 13" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" />
      {/* тело */}
      <path d="M50 18 C 74 18, 88 36, 88 58 C 88 80, 72 94, 50 94 C 28 94, 12 80, 12 58 C 12 36, 26 18, 50 18 Z" fill={`url(#${gid})`} />
      {/* глаза */}
      <ellipse cx={38} cy={54} rx={10} ry={12} fill="#fffdf6" />
      <ellipse cx={62} cy={54} rx={10} ry={12} fill="#fffdf6" />
      <circle cx={39} cy={56} r={6} fill="#1a0f05" />
      <circle cx={63} cy={56} r={6} fill="#1a0f05" />
      <circle cx={41} cy={53} r={2.2} fill="#fff" />
      <circle cx={65} cy={53} r={2.2} fill="#fff" />
      <path d="M44 72 Q 50 77 56 72" fill="none" stroke="#1a0f05" strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
      {/* аксессуары */}
      {id === "designer" && (
        <path d="M24 30 C 30 14, 70 12, 78 26 C 70 30, 34 34, 24 30 Z M70 16 l 6 -6" fill="#2b1f5c" stroke="#2b1f5c" strokeWidth={2} strokeLinecap="round" />
      )}
      {id === "marketer" && (
        <g>
          <path d="M80 44 l 14 -8 v 26 l -14 -8 Z" fill="#fff" opacity={0.9} />
          <path d="M96 42 q 4 7 0 14" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}
      {id === "analyst" && (
        <g fill="none" stroke="#06202a" strokeWidth={2.6}>
          <circle cx={38} cy={54} r={13} />
          <circle cx={62} cy={54} r={13} />
          <path d="M51 54 h -2" />
        </g>
      )}
      {id === "interviewer" && (
        <g fill="none" stroke="#0b2a14" strokeWidth={3} strokeLinecap="round">
          <path d="M16 56 C 16 26, 84 26, 84 56" />
          <path d="M84 60 q 0 16 -18 18" />
          <circle cx={64} cy={78} r={3} fill="#0b2a14" />
        </g>
      )}
      {id === "developer" && (
        <g>
          <rect x={22} y={34} width={56} height={10} rx={5} fill="#2a1400" />
          <rect x={28} y={36} width={18} height={6} rx={3} fill="#ffcf99" opacity={0.8} />
          <rect x={54} y={36} width={18} height={6} rx={3} fill="#ffcf99" opacity={0.8} />
        </g>
      )}
    </svg>
  );
}
