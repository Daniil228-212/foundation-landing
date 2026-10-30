"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { AGENTS } from "@/content/agents";
import { NEXUSES, NODE_STATUS, type NexusId } from "@/content/nexus";
import { nexusFill, type CortexNode } from "@/lib/mentorScript";
import { useFoundation } from "@/store/foundation";

const EASE = [0.16, 1, 0.3, 1] as const;

/* детерминированный ГПСЧ — одинаковая раскладка на сервере и клиенте */
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const W = 1000;
const H = 560;
const CENTERS: Record<NexusId, { x: number; y: number; r: number }> = {
  market: { x: 210, y: 190, r: 150 },
  product: { x: 520, y: 330, r: 165 },
  growth: { x: 810, y: 180, r: 140 },
  ops: { x: 820, y: 430, r: 110 },
  tech: { x: 260, y: 440, r: 95 },
};

type Dot = { x: number; y: number; r: number };

function cluster(id: NexusId, n: number): { dots: Dot[]; edges: [number, number][] } {
  const c = CENTERS[id];
  const rand = rng(id.length * 9973 + c.x);
  const dots: Dot[] = [];
  for (let i = 0; i < n; i++) {
    // органичная «туманность»: радиус с шумом по углу
    const a = rand() * Math.PI * 2;
    const k = Math.sqrt(rand()) * (0.75 + 0.25 * Math.sin(a * 3 + c.x));
    const q = (v: number) => Math.round(v * 10) / 10;
    dots.push({ x: q(c.x + Math.cos(a) * c.r * k * 1.25), y: q(c.y + Math.sin(a) * c.r * k * 0.82), r: q(1 + rand() * 2.4) });
  }
  const edges: [number, number][] = [];
  dots.forEach((d, i) => {
    const near = dots
      .map((o, j) => ({ j, dist: (o.x - d.x) ** 2 + (o.y - d.y) ** 2 }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 2);
    near.forEach((o) => i < o.j && edges.push([i, o.j]));
  });
  return { dots, edges };
}

/** позиция узла Кортекса внутри своего облака */
function nodePos(node: CortexNode, i: number) {
  const c = CENTERS[node.nexus];
  const a = i * 2.39996 + node.nexus.length;
  const k = 0.25 + ((i * 0.37) % 0.6);
  return { x: c.x + Math.cos(a) * c.r * k, y: c.y + Math.sin(a) * c.r * k * 0.7 };
}

function NexusField() {
  const nodes = useFoundation((s) => s.nodes);
  const unlocked = useFoundation((s) => s.unlocked);
  const hovered = useFoundation((s) => s.hoveredAgent);
  const clusters = useMemo(() => NEXUSES.map((n) => ({ nx: n, ...cluster(n.id, n.id === "tech" ? 42 : 70) })), []);

  const placed = useMemo(() => {
    const per: Record<string, number> = {};
    return nodes.map((n) => ({ n, p: nodePos(n, (per[n.nexus] = (per[n.nexus] ?? 0) + 1)) }));
  }, [nodes]);
  const byId = Object.fromEntries(placed.map((x) => [x.n.id, x.p]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Кортекс: облака четырёх Нексусов и заблокированная Разработка">
      <defs>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {clusters.map(({ nx, dots, edges }) => {
        const fill = nexusFill(nodes, nx.id);
        const locked = !unlocked.includes(nx.id);
        const lit = Math.round(dots.length * (0.08 + fill * 0.92));
        const dim = hovered ? !agentScope(hovered).includes(nx.id) : false;
        const c = CENTERS[nx.id];
        return (
          <g key={nx.id} opacity={dim ? 0.18 : locked ? 0.35 : 1} style={{ transition: "opacity 1.2s cubic-bezier(.16,1,.3,1)" }}>
            {edges.map(([a, b], i) => (
              <line
                key={i}
                x1={dots[a].x}
                y1={dots[a].y}
                x2={dots[b].x}
                y2={dots[b].y}
                stroke={a < lit && b < lit ? nx.color : "rgba(236,232,225,.08)"}
                strokeOpacity={a < lit && b < lit ? 0.45 : 1}
                strokeWidth={0.6}
                style={{ transition: "stroke 1.6s cubic-bezier(.16,1,.3,1)" }}
              />
            ))}
            {dots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={d.r}
                fill={i < lit ? nx.color : "rgba(236,232,225,.16)"}
                style={{ transition: `fill 1.6s cubic-bezier(.16,1,.3,1) ${i * 12}ms` }}
              />
            ))}
            <text x={c.x} y={c.y - c.r * 0.82 - 14} textAnchor="middle" className="serif" fill="#ece8e1" fontSize="22" fontStyle="italic">
              {nx.title}
            </text>
            <text x={c.x} y={c.y - c.r * 0.82 + 4} textAnchor="middle" fill="rgba(236,232,225,.55)" fontSize="10" letterSpacing="2.4">
              {locked ? "🔒 " : ""}
              {nx.latin.toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* жёсткие связи между узлами (свойство продукта → боль рынка и т. п.) */}
      {placed.flatMap(({ n, p }) =>
        n.links
          .filter((l) => byId[l])
          .map((l) => {
            const q = byId[l];
            const mx = (p.x + q.x) / 2;
            const my = (p.y + q.y) / 2 - 40;
            return (
              <motion.path
                key={n.id + l}
                d={`M${p.x} ${p.y} Q ${mx} ${my} ${q.x} ${q.y}`}
                fill="none"
                stroke="#ffd54f"
                strokeOpacity={0.6}
                strokeWidth={1}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1, transition: { duration: 1.6, ease: EASE } }}
              />
            );
          }),
      )}
      {placed.map(({ n, p }) => (
        <motion.g key={n.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1, transition: { duration: 1.4, ease: EASE } }} style={{ transformOrigin: `${p.x}px ${p.y}px` }}>
          <circle cx={p.x} cy={p.y} r={14} fill={NODE_STATUS[n.status].color} opacity={0.25} filter="url(#soft)" />
          <circle cx={p.x} cy={p.y} r={5} fill={NODE_STATUS[n.status].color} />
        </motion.g>
      ))}
    </svg>
  );
}

function agentScope(id: string) {
  return AGENTS.find((a) => a.id === id)?.scope ?? [];
}

const KIND: Record<string, string> = {
  idea: "Идея",
  audience: "Аудитория",
  alternative: "Альтернатива",
  pain: "Боль",
  feature: "Свойство продукта",
  metric: "Метрика",
  hypothesis: "Гипотеза",
  risk: "Риск",
  stack: "Стек",
};

function NexusCard({ id }: { id: NexusId }) {
  const nx = NEXUSES.find((n) => n.id === id)!;
  const allNodes = useFoundation((s) => s.nodes);
  const nodes = useMemo(() => allNodes.filter((n) => n.nexus === id), [allNodes, id]);
  const unlocked = useFoundation((s) => s.unlocked.includes(id));
  const fill = nexusFill(allNodes, id);
  const lit = fill >= 0.5;
  const idx = ["market", "product", "growth", "ops"].indexOf(id) + 1;

  return (
    <article
      className="relative flex min-h-[260px] flex-col overflow-hidden rounded-[28px] border p-6 transition-[border-color,background-color,opacity] duration-[1600ms] ease-[var(--ease-atelier)] sm:p-7"
      style={{
        borderColor: lit ? `color-mix(in oklab, ${nx.color} 55%, transparent)` : "var(--hair)",
        background: lit ? `radial-gradient(120% 90% at 0% 0%, color-mix(in oklab, ${nx.color} 14%, transparent), transparent 60%), var(--graphite-2)` : "var(--graphite-2)",
        opacity: unlocked ? 1 : 0.55,
      }}
    >
      <p className="text-[11px] tracking-[0.14em] text-ivory-60">
        nexus: {id === "ops" ? "operations" : id} <span style={{ color: lit ? nx.color : undefined }}>•</span> 0{idx}
      </p>
      <h3 className="serif mt-3 text-[34px] leading-none">{nx.title}</h3>
      <div className="mt-4 h-px w-full bg-hair">
        <div className="h-px origin-left transition-transform duration-[1600ms] ease-[var(--ease-atelier)]" style={{ background: nx.color, transform: `scaleX(${fill})` }} />
      </div>

      {!unlocked ? (
        <p className="mt-auto pt-8 text-[13px] leading-relaxed text-ivory-60">
          Заблокирован. Откроется, когда агент Рынка подтвердит полноту и объективность данных.
        </p>
      ) : nodes.length === 0 ? (
        <p className="mt-auto pt-8 text-[13px] leading-relaxed text-ivory-40">Нет объективных данных. Ответьте Ментору — карточка загорится.</p>
      ) : (
        <ul className="mt-5 space-y-2.5">
          {nodes.map((n) => (
            <motion.li
              key={n.id}
              initial={{ opacity: 0, filter: "blur(12px)" }}
              animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 1.4, ease: EASE } }}
              className="flex items-baseline justify-between gap-4 text-[13px]"
            >
              <span className="min-w-0">
                <span className="text-ivory-60">{KIND[n.kind]} · </span>
                <span className="text-ivory">{n.label}</span>
              </span>
              <span className="shrink-0 text-[11px]" style={{ color: NODE_STATUS[n.status].color }}>
                {NODE_STATUS[n.status].label.toLowerCase()}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function Cortex() {
  return (
    <section id="cortex" aria-labelledby="cortex-title" className="relative py-24 lg:py-36">
      <div className="container-x">
        <header className="mx-auto mb-14 max-w-[720px] text-center">
          <p className="caps mb-5">Кортекс · единый граф решений</p>
          <h2 id="cortex-title" className="serif text-[clamp(40px,6vw,84px)] leading-[0.98] tracking-[0.01em]">
            Каждый ответ достраивает <em>карту проекта</em>
          </h2>
          <p className="mx-auto mt-6 max-w-[52ch] text-[15px] leading-relaxed text-ivory-60">
            Ни один элемент не живёт отдельно: свойство продукта всегда связано с болью рынка. Облака загораются, только когда наполнены
            проверяемыми данными.
          </p>
        </header>

        <NexusField />

        <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {(["market", "product", "growth", "ops"] as NexusId[]).map((id) => (
            <NexusCard key={id} id={id} />
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            ["Документы", "PRD, скрипты интервью, отчёты — собираются из графа, а не пишутся с нуля."],
            ["Источники", "Любимые авторы и площадки — ИИ опирается на них в первую очередь."],
            ["Таблицы и фото", "Загрузите CSV или фото доски: распознаем и разложим по Нексусам."],
          ].map(([t, d]) => (
            <article key={t} className="rounded-[28px] border border-hair bg-graphite-2 p-6 sm:p-7">
              <h3 className="serif text-[26px] leading-none">{t}</h3>
              <p className="mt-3 text-[13px] leading-relaxed text-ivory-60">{d}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
