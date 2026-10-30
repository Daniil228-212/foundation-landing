import { NEXUSES } from "@/content/nexus";

/**
 * Статичное превью Кортекса (фаза 1). Нейронная раскладка: 4 Нексуса-хаба,
 * ветви и подветви разного размера, изогнутые связи. В фазе 5 заменится на React Flow.
 */
const HUBS: Record<string, { x: number; y: number }> = {
  market: { x: 210, y: 170 },
  product: { x: 560, y: 150 },
  growth: { x: 250, y: 420 },
  ops: { x: 560, y: 430 },
  tech: { x: 800, y: 300 },
};

type P = { x: number; y: number };

function layout() {
  const nodes: { id: string; p: P; r: number; color: string; label: string; level: number; locked?: boolean }[] = [];
  const edges: { a: P; b: P; color: string; level: number; locked?: boolean }[] = [];
  for (const nx of NEXUSES) {
    const hub = HUBS[nx.id];
    nodes.push({ id: nx.id, p: hub, r: nx.locked ? 22 : 30, color: nx.color, label: nx.title, level: 0, locked: nx.locked });
    const n = nx.branches.length;
    nx.branches.forEach((b, i) => {
      const ang = (i / n) * Math.PI * 2 + (nx.id.length % 3);
      const R = 92;
      const bp = { x: hub.x + Math.cos(ang) * R, y: hub.y + Math.sin(ang) * R * 0.8 };
      nodes.push({ id: b.id, p: bp, r: 11 + (b.children?.length ?? 0) * 2.5, color: nx.color, label: b.title, level: 1, locked: nx.locked });
      edges.push({ a: hub, b: bp, color: nx.color, level: 1, locked: nx.locked });
      b.children?.forEach((c, j) => {
        const a2 = ang + (j - (b.children!.length - 1) / 2) * 0.55;
        const cp = { x: bp.x + Math.cos(a2) * 54, y: bp.y + Math.sin(a2) * 46 };
        nodes.push({ id: c.id, p: cp, r: 5 + ((c.id.length * 7) % 4), color: nx.color, label: c.title, level: 2 });
        edges.push({ a: bp, b: cp, color: nx.color, level: 2 });
      });
    });
  }
  return { nodes, edges };
}

const { nodes, edges } = layout();

function curve(a: P, b: P) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return `M${a.x} ${a.y} Q ${mx - dy * 0.18} ${my + dx * 0.18} ${b.x} ${b.y}`;
}

export function GraphPreview({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 580" className={className} role="img" aria-label="Граф знаний проекта: четыре Нексуса — Рынок, Продукт, Рост, Операционная модель — и заблокированная ветка Разработка">
      <defs>
        <filter id="gp-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* межнексусные связи */}
      {[
        ["market", "product"],
        ["market", "growth"],
        ["product", "ops"],
        ["growth", "ops"],
        ["product", "tech"],
      ].map(([a, b]) => (
        <path
          key={a + b}
          d={curve(HUBS[a], HUBS[b])}
          fill="none"
          stroke="rgba(200,210,255,.18)"
          strokeWidth={1.5}
          strokeDasharray={b === "tech" ? "4 6" : undefined}
        />
      ))}
      {edges.map((e, i) => (
        <path key={i} d={curve(e.a, e.b)} fill="none" stroke={e.color} strokeOpacity={e.locked ? 0.15 : e.level === 1 ? 0.45 : 0.28} strokeWidth={e.level === 1 ? 1.6 : 1} />
      ))}
      {nodes.map((n) => (
        <g key={n.id} opacity={n.locked ? 0.35 : 1}>
          <circle cx={n.p.x} cy={n.p.y} r={n.r} fill={n.color} fillOpacity={n.level === 0 ? 0.22 : 0.85} stroke={n.color} strokeWidth={n.level === 0 ? 2 : 0} filter={n.level < 2 ? "url(#gp-glow)" : undefined} />
          {n.level === 0 && (
            <text x={n.p.x} y={n.p.y + n.r + 18} textAnchor="middle" fill="#eef0ff" fontSize="14" fontWeight="600" fontFamily="var(--font-onest)" stroke="#04050c" strokeWidth={5} paintOrder="stroke">
              {n.locked ? "🔒 " : ""}
              {n.label}
            </text>
          )}
          {n.level === 1 && (
            <text x={n.p.x} y={n.p.y - n.r - 6} textAnchor="middle" fill="#b4b9d6" fontSize="11" fontFamily="var(--font-onest)" stroke="#04050c" strokeWidth={4} paintOrder="stroke">
              {n.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
