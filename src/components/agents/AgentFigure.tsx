import { useId } from "react";
import type { AgentId } from "@/content/agents";

/**
 * Агент — матовая виниловая фигурка (по фото 3): голова-«луковка» с завитком,
 * большие тёмные глянцевые глаза, короткая улыбка, маленькое тело с ручками.
 * Цвет, одежда и аксессуар — по роли.
 */

const LOOK: Record<AgentId, { body: string; shade: string }> = {
  designer: { body: "#e4dcfb", shade: "#a99cd6" },
  marketer: { body: "#fbdbe8", shade: "#d79ab6" },
  analyst: { body: "#d6f1ee", shade: "#8fc3be" },
  interviewer: { body: "#dff2d8", shade: "#a1c896" },
  developer: { body: "#fbe5d2", shade: "#d6ac8a" },
};

export function AgentFigure({ id, size = 72, sleeping = false, className }: { id: AgentId; size?: number; sleeping?: boolean; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const { body, shade } = LOOK[id];
  const g = (n: string) => `${n}-${uid}`;

  return (
    <svg viewBox="0 0 120 150" width={size} height={(size * 150) / 120} className={className} aria-hidden>
      <defs>
        <radialGradient id={g("skin")} cx="38%" cy="30%" r="78%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.45" stopColor={body} />
          <stop offset="1" stopColor={shade} />
        </radialGradient>
        <radialGradient id={g("eye")} cx="50%" cy="70%" r="70%">
          <stop offset="0" stopColor="#3f8791" />
          <stop offset="0.45" stopColor="#1d3442" />
          <stop offset="1" stopColor="#0d141c" />
        </radialGradient>
        <filter id={g("soft")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>

      {/* тень */}
      <ellipse cx="60" cy="144" rx="26" ry="4" fill="#14121a" opacity="0.35" filter={`url(#${g("soft")})`} />

      {/* ножки и тело */}
      <rect x="47" y="122" width="11" height="19" rx="5.5" fill={`url(#${g("skin")})`} />
      <rect x="62" y="122" width="11" height="19" rx="5.5" fill={`url(#${g("skin")})`} />
      <path d="M41 97 C 38 112, 41 128, 52 131 L 68 131 C 79 128, 82 112, 79 97 Z" fill={`url(#${g("skin")})`} />

      {/* одежда */}
      {id === "marketer" && (
        <g>
          <path d="M41 99 C 39 113, 42 128, 52 131 L 68 131 C 78 128, 81 113, 79 99 L 66 99 L 60 116 L 54 99 Z" fill="#b84a7f" />
          <path d="M54 99 L 60 116 L 66 99" fill="none" stroke="#f6c6dc" strokeWidth="1.6" />
        </g>
      )}
      {id === "developer" && (
        <g>
          <path d="M40 98 C 37 113, 41 129, 52 132 L 68 132 C 79 129, 83 113, 80 98 C 74 94, 46 94, 40 98 Z" fill="#3b4250" />
          <path d="M55 101 L 54 113 M65 101 L 66 113" stroke="#e9e3dc" strokeWidth="1.4" strokeLinecap="round" />
          <rect x="49" y="117" width="22" height="8" rx="3" fill="#2f3542" />
        </g>
      )}
      {id === "analyst" && <path d="M60 100 L 56 106 L 60 124 L 64 106 Z" fill="#2c8c88" />}
      {id === "designer" && (
        <g>
          <path d="M42 98 C 50 104, 70 104, 78 98 C 79 102, 76 106, 70 107 L 50 107 C 44 106, 41 102, 42 98 Z" fill="#f08a7a" />
          <path d="M66 105 L 70 120 L 64 119 Z" fill="#e2725f" />
        </g>
      )}

      {/* ручки в стороны */}
      <path d="M42 104 C 34 106, 28 109, 25 113 C 24 116, 27 117, 29 115 C 33 112, 38 110, 43 110 Z" fill={`url(#${g("skin")})`} />
      <path d="M78 104 C 86 106, 92 109, 95 113 C 96 116, 93 117, 91 115 C 87 112, 82 110, 77 110 Z" fill={`url(#${g("skin")})`} />

      {/* аксессуары в руках */}
      {id === "designer" && (
        <g transform="rotate(-35 96 112)">
          <rect x="93" y="96" width="5" height="22" rx="1.5" fill="#ffcf5a" />
          <path d="M93 118 L 95.5 124 L 98 118 Z" fill="#f4d7b0" />
          <rect x="93" y="94" width="5" height="3" rx="1" fill="#ff8f8f" />
        </g>
      )}
      {id === "marketer" && (
        <g>
          <path d="M14 104 L 26 110 L 26 118 L 14 124 Z" fill="#ffffff" stroke="#d6cbd2" strokeWidth="0.8" />
          <rect x="25" y="109" width="4" height="10" rx="1.5" fill="#e45b8f" />
        </g>
      )}
      {id === "analyst" && (
        <g>
          <rect x="88" y="104" width="18" height="22" rx="3" fill="#24303a" />
          <rect x="91.5" y="117" width="3" height="6" fill="#7ee0d6" />
          <rect x="96" y="113" width="3" height="10" fill="#7ee0d6" />
          <rect x="100.5" y="109" width="3" height="14" fill="#7ee0d6" />
        </g>
      )}
      {id === "interviewer" && (
        <g>
          <rect x="89" y="105" width="16" height="20" rx="2" fill="#fbfaf6" stroke="#cfd8c8" strokeWidth="0.8" />
          <path d="M92 111 H 102 M92 115 H 102 M92 119 H 99" stroke="#9cb393" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
      {id === "developer" && (
        <g>
          <rect x="84" y="108" width="22" height="14" rx="2" fill="#c9ced6" />
          <rect x="86" y="110" width="18" height="10" rx="1" fill="#2a3140" />
          <path d="M89 113 L 92 115 L 89 117 M94 117 H 98" stroke="#ffb86b" strokeWidth="1.1" fill="none" strokeLinecap="round" />
        </g>
      )}

      {/* голова-«луковка» с завитком */}
      <path
        d="M60 21 C 64 15, 70 12, 69 5 C 76 9, 76 18, 69 24 C 76 28, 84 34, 92 44 C 100 54, 103 66, 101 78 C 98 94, 82 104, 60 104 C 38 104, 22 94, 19 78 C 17 66, 20 54, 28 44 C 36 34, 46 27, 55 24 C 57 23, 59 22, 60 21 Z"
        fill={`url(#${g("skin")})`}
      />
      {/* мягкий блик на макушке */}
      <ellipse cx="44" cy="44" rx="13" ry="8" fill="#ffffff" opacity="0.45" filter={`url(#${g("soft")})`} />

      {/* глаза */}
      {sleeping ? (
        <g stroke="#2a2530" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M39 68 Q 46 72 53 68" />
          <path d="M67 68 Q 74 72 81 68" />
        </g>
      ) : (
        <g>
          {[46, 74].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy="67" rx="8.6" ry="11" fill={`url(#${g("eye")})`} />
              <ellipse cx={cx} cy="67" rx="8.6" ry="11" fill="none" stroke="#0b1016" strokeOpacity="0.4" strokeWidth="0.8" />
              <circle cx={cx - 3} cy="61.5" r="2.8" fill="#ffffff" />
              <circle cx={cx + 3.2} cy="73" r="1.3" fill="#ffffff" opacity="0.8" />
            </g>
          ))}
        </g>
      )}
      {/* улыбка */}
      <path d="M53 86 Q 60 88.5 67 86" fill="none" stroke="#3a3440" strokeWidth="1.6" strokeLinecap="round" />

      {/* головные аксессуары */}
      {id === "designer" && (
        <g>
          <ellipse cx="50" cy="30" rx="25" ry="8" transform="rotate(-14 50 30)" fill="#4b3b6b" />
          <circle cx="42" cy="22" r="2.4" fill="#4b3b6b" />
        </g>
      )}
      {id === "analyst" && (
        <g fill="none" stroke="#1f3a3c" strokeWidth="2">
          <circle cx="46" cy="67" r="12.5" />
          <circle cx="74" cy="67" r="12.5" />
          <path d="M58.5 66 H 61.5" />
        </g>
      )}
      {id === "interviewer" && (
        <g>
          <path d="M22 62 C 22 32, 98 32, 98 62" fill="none" stroke="#2f4a33" strokeWidth="3.2" strokeLinecap="round" />
          <rect x="15" y="56" width="9" height="16" rx="4" fill="#2f4a33" />
          <rect x="96" y="56" width="9" height="16" rx="4" fill="#2f4a33" />
          <path d="M100 70 C 100 82, 86 88, 72 87" fill="none" stroke="#2f4a33" strokeWidth="2" strokeLinecap="round" />
          <circle cx="71" cy="87" r="2.6" fill="#2f4a33" />
        </g>
      )}
      {id === "marketer" && <path d="M78 40 L 84 30 L 86 42 Z" fill="#ffd27a" />}
      {id === "developer" && (
        <path d="M24 60 C 22 34, 42 22, 60 22 C 80 22, 98 34, 96 60 C 92 44, 80 34, 60 34 C 40 34, 28 44, 24 60 Z" fill="#3b4250" />
      )}
    </svg>
  );
}
