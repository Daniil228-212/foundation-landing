"use client";

import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";
import { NEXUSES, NODE_STATUS, type NexusBranch, type NexusId, type NodeStatus } from "@/content/nexus";
import { nexusFill, type CortexNode } from "@/lib/mentorScript";
import { useFoundation } from "@/store/foundation";
import { Window } from "./Window";

/* ------------------------------------------------------------------
   Граф проекта в духе Obsidian: Нексусы-хабы, по клику раскрываются
   ветви и подветви; факты из диалога прикрепляются к своим веткам.
------------------------------------------------------------------- */

type Kind = "hub" | "branch" | "leaf" | "fact";
type GNode = SimulationNodeDatum & {
  id: string;
  label: string;
  nexus: NexusId;
  kind: Kind;
  r: number;
  color: string;
  status?: NodeStatus;
  locked?: boolean;
};
type GLink = SimulationLinkDatum<GNode> & { id: string; cross?: boolean; hub?: boolean };

const HUB_HOME: Record<NexusId, [number, number]> = {
  market: [-260, -120],
  product: [60, -170],
  growth: [300, 40],
  ops: [-120, 190],
  tech: [330, -250],
};

const HUB_LINKS: [NexusId, NexusId][] = [
  ["market", "product"],
  ["product", "growth"],
  ["growth", "ops"],
  ["ops", "market"],
  ["product", "tech"],
];

/** куда крепится факт из диалога */
function anchorFor(n: CortexNode): string {
  if (n.nexus === "ops") return n.kind === "hypothesis" ? "processes" : "team";
  if (n.kind === "audience") return "segments";
  if (n.kind === "alternative") return "alternatives";
  if (n.kind === "pain") return "jtbd";
  if (n.kind === "feature") return "value-prop";
  if (n.kind === "metric") return /cac|ltv/i.test(n.label) ? "unit-economics" : "metrics";
  return n.nexus;
}

function build(expanded: Set<NexusId>, facts: CortexNode[], unlocked: NexusId[]) {
  const nodes: GNode[] = [];
  const links: GLink[] = [];
  for (const nx of NEXUSES) {
    const locked = !unlocked.includes(nx.id);
    nodes.push({ id: nx.id, label: nx.title, nexus: nx.id, kind: "hub", r: 22, color: nx.color, locked });
    if (!expanded.has(nx.id) || locked) continue;
    const walk = (b: NexusBranch, parent: string, depth: number) => {
      const kids = b.children?.length ?? 0;
      nodes.push({
        id: b.id,
        label: b.title,
        nexus: nx.id,
        kind: depth === 1 ? "branch" : "leaf",
        r: depth === 1 ? 9 + kids * 2.2 : 5.5,
        color: nx.color,
      });
      links.push({ id: `${parent}>${b.id}`, source: parent, target: b.id });
      b.children?.forEach((c) => walk(c, b.id, depth + 1));
    };
    nx.branches.forEach((b) => walk(b, nx.id, 1));
  }
  const ids = new Set(nodes.map((n) => n.id));
  for (const f of facts) {
    const a = anchorFor(f);
    nodes.push({ id: f.id, label: f.label, nexus: f.nexus, kind: "fact", r: 7, color: NODE_STATUS[f.status].color, status: f.status });
    links.push({ id: `${f.id}~a`, source: ids.has(a) ? a : f.nexus, target: f.id });
  }
  for (const f of facts) for (const l of f.links) links.push({ id: `${f.id}~${l}`, source: f.id, target: l, cross: true });
  for (const [a, b] of HUB_LINKS) links.push({ id: `${a}=${b}`, source: a, target: b, hub: true });
  return { nodes, links };
}

function GraphCanvas({ expanded, toggle, onSelect, selected }: { expanded: Set<NexusId>; toggle: (n: NexusId) => void; onSelect: (n: GNode | null) => void; selected: string | null }) {
  const facts = useFoundation((s) => s.nodes);
  const unlocked = useFoundation((s) => s.unlocked);
  const graph = useMemo(() => build(expanded, facts, unlocked), [expanded, facts, unlocked]);

  const wrap = useRef<HTMLDivElement>(null);
  const sim = useRef<Simulation<GNode, GLink> | null>(null);
  const prev = useRef(new Map<string, GNode>());
  const nodeEls = useRef(new Map<string, SVGGElement>());
  const linkEls = useRef(new Map<string, SVGLineElement>());
  const view = useRef({ x: 0, y: 0, k: 1 });
  const viewEl = useRef<SVGGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
      view.current.k = Math.min(1, Math.max(0.6, e.contentRect.width / 820));
      applyView();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const applyView = () => {
    const v = view.current;
    viewEl.current?.setAttribute("transform", `translate(${v.x} ${v.y}) scale(${v.k})`);
  };

  // симуляция: сохраняем позиции, новые узлы «вырастают» из родителя
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const byId = new Map(graph.nodes.map((n) => [n.id, n]));
    for (const n of graph.nodes) {
      const p = prev.current.get(n.id);
      if (p) Object.assign(n, { x: p.x, y: p.y, vx: p.vx, vy: p.vy });
      else if (n.kind === "hub") [n.x, n.y] = HUB_HOME[n.nexus];
    }
    for (const l of graph.links) {
      const s = byId.get(l.source as string);
      const t = byId.get(l.target as string);
      if (s && t && t.x === undefined && s.x !== undefined) {
        t.x = s.x + (Math.random() - 0.5) * 20;
        t.y = s.y! + (Math.random() - 0.5) * 20;
      }
    }

    sim.current?.stop();
    const s = forceSimulation<GNode, GLink>(graph.nodes)
      .force(
        "link",
        forceLink<GNode, GLink>(graph.links)
          .id((d) => d.id)
          .distance((l) => (l.hub ? 260 : l.cross ? 140 : (l.target as GNode).kind === "leaf" ? 38 : (l.target as GNode).kind === "fact" ? 46 : 78))
          .strength((l) => (l.hub ? 0.04 : l.cross ? 0.08 : 0.7)),
      )
      .force("charge", forceManyBody<GNode>().strength((d) => (d.kind === "hub" ? -520 : d.kind === "branch" ? -160 : -60)))
      .force("collide", forceCollide<GNode>((d) => d.r + 8))
      .force("x", forceX<GNode>((d) => (d.kind === "hub" ? HUB_HOME[d.nexus][0] : 0)).strength((d) => (d.kind === "hub" ? 0.12 : 0.01)))
      .force("y", forceY<GNode>((d) => (d.kind === "hub" ? HUB_HOME[d.nexus][1] : 0)).strength((d) => (d.kind === "hub" ? 0.12 : 0.01)))
      .alpha(prev.current.size ? 0.7 : 1)
      .alphaDecay(0.025);

    const tick = () => {
      for (const n of graph.nodes) nodeEls.current.get(n.id)?.setAttribute("transform", `translate(${n.x!.toFixed(1)} ${n.y!.toFixed(1)})`);
      for (const l of graph.links) {
        const el = linkEls.current.get(l.id);
        const a = l.source as GNode;
        const b = l.target as GNode;
        if (!el || a.x === undefined || b.x === undefined) continue;
        el.setAttribute("x1", a.x.toFixed(1));
        el.setAttribute("y1", a.y!.toFixed(1));
        el.setAttribute("x2", b.x.toFixed(1));
        el.setAttribute("y2", b.y!.toFixed(1));
      }
      prev.current = new Map(graph.nodes.map((n) => [n.id, n]));
    };
    s.on("tick", tick);
    if (reduce) {
      s.stop();
      s.tick(300);
      tick();
    }
    sim.current = s;
    return () => void s.stop();
  }, [graph]);

  // соседи для подсветки (как в Obsidian)
  // как в Obsidian: соседи подсвечиваются только при наведении
  const focus = hover;
  const neighbours = useMemo(() => {
    if (!focus) return null;
    const set = new Set([focus]);
    for (const l of graph.links) {
      const a = typeof l.source === "object" ? (l.source as GNode).id : (l.source as string);
      const b = typeof l.target === "object" ? (l.target as GNode).id : (l.target as string);
      if (a === focus) set.add(b);
      if (b === focus) set.add(a);
    }
    return set;
  }, [focus, graph]);

  // перетаскивание узлов, панорама, зум
  const drag = useRef<{ id?: string; sx: number; sy: number; moved: boolean; pan?: { x: number; y: number } } | null>(null);
  const toGraph = (cx: number, cy: number) => {
    const r = wrap.current!.getBoundingClientRect();
    const v = view.current;
    return { x: (cx - r.left - size.w / 2 - v.x) / v.k, y: (cy - r.top - size.h / 2 - v.y) / v.k };
  };
  const onPointerDown = (e: React.PointerEvent, id?: string) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { id, sx: e.clientX, sy: e.clientY, moved: false, pan: id ? undefined : { x: view.current.x, y: view.current.y } };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 4) d.moved = true;
    if (!d.moved) return;
    if (d.id) {
      const n = prev.current.get(d.id);
      if (!n) return;
      const p = toGraph(e.clientX, e.clientY);
      n.fx = p.x;
      n.fy = p.y;
      sim.current?.alphaTarget(0.3).restart();
    } else if (d.pan) {
      view.current.x = d.pan.x + (e.clientX - d.sx);
      view.current.y = d.pan.y + (e.clientY - d.sy);
      applyView();
    }
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.id) {
      const n = prev.current.get(d.id);
      if (n) {
        n.fx = null;
        n.fy = null;
      }
      sim.current?.alphaTarget(0);
      if (!d.moved) activate(d.id);
    } else if (!d.moved) onSelect(null);
  };
  const onWheel = (e: React.WheelEvent) => {
    const v = view.current;
    const k = Math.min(2.4, Math.max(0.4, v.k * Math.exp(-e.deltaY * 0.0015)));
    const r = wrap.current!.getBoundingClientRect();
    const mx = e.clientX - r.left - size.w / 2;
    const my = e.clientY - r.top - size.h / 2;
    v.x = mx - ((mx - v.x) * k) / v.k;
    v.y = my - ((my - v.y) * k) / v.k;
    v.k = k;
    applyView();
  };

  const activate = (id: string) => {
    const n = graph.nodes.find((x) => x.id === id);
    if (!n) return;
    onSelect(n);
    if (n.kind === "hub" && !n.locked) toggle(n.nexus);
  };

  return (
    <div
      ref={wrap}
      className="absolute inset-0 touch-none select-none"
      onPointerDown={(e) => onPointerDown(e)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      style={{ background: "radial-gradient(70% 70% at 50% 45%, rgba(255,213,79,.05), transparent 70%)" }}
    >
      <svg width={size.w} height={size.h} className="block" role="group" aria-label="Граф проекта">
        <defs>
          <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <g transform={`translate(${size.w / 2} ${size.h / 2})`}>
          <g ref={viewEl}>
            {graph.links.map((l) => {
              const a = typeof l.source === "object" ? (l.source as GNode).id : (l.source as string);
              const b = typeof l.target === "object" ? (l.target as GNode).id : (l.target as string);
              const on = !neighbours || (neighbours.has(a) && neighbours.has(b));
              return (
                <line
                  key={l.id}
                  ref={(el) => {
                    if (el) linkEls.current.set(l.id, el);
                    else linkEls.current.delete(l.id);
                  }}
                  stroke={l.cross ? "#ffd54f" : "rgba(236,232,225,1)"}
                  strokeOpacity={l.cross ? (on ? 0.8 : 0.15) : l.hub ? (on ? 0.12 : 0.04) : on ? 0.28 : 0.06}
                  strokeWidth={l.cross ? 1.4 : l.hub ? 1 : 0.9}
                  strokeDasharray={l.hub ? "3 6" : undefined}
                  style={{ transition: "stroke-opacity .3s" }}
                />
              );
            })}
            {graph.nodes.map((n) => {
              const on = !neighbours || neighbours.has(n.id);
              const showLabel = n.kind !== "leaf" || neighbours?.has(n.id) || expanded.has(n.nexus);
              return (
                <g
                  key={n.id}
                  ref={(el) => {
                    if (el) nodeEls.current.set(n.id, el);
                    else nodeEls.current.delete(n.id);
                  }}
                  role="button"
                  tabIndex={n.kind === "hub" || n.kind === "fact" ? 0 : -1}
                  aria-label={`${n.label}${n.kind === "hub" ? (n.locked ? ", заблокирован" : expanded.has(n.nexus) ? ", свернуть ветви" : ", раскрыть ветви") : ""}`}
                  aria-pressed={n.kind === "hub" ? expanded.has(n.nexus) : undefined}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), activate(n.id))}
                  onPointerDown={(e) => onPointerDown(e, n.id)}
                  onPointerEnter={() => setHover(n.id)}
                  onPointerLeave={() => setHover(null)}
                  opacity={on ? (n.locked ? 0.4 : 1) : 0.15}
                  style={{ transition: "opacity .3s", cursor: "pointer", outline: "none" }}
                  className="graph-node"
                >
                  {(n.kind === "hub" || n.kind === "fact") && <circle r={n.r * 1.6} fill={n.color} opacity={n.kind === "hub" ? 0.35 : 0.3} filter="url(#glow)" />}
                  {n.kind === "hub" && !expanded.has(n.nexus) && !n.locked && (
                    <circle r={n.r + 6} fill="none" stroke={n.color} strokeOpacity={0.5} className="hub-pulse" />
                  )}
                  <circle
                    r={n.r}
                    fill={n.kind === "hub" ? "#171716" : n.color}
                    stroke={n.color}
                    strokeWidth={n.kind === "hub" ? 1.5 : 0}
                    fillOpacity={n.kind === "leaf" ? 0.75 : 1}
                  />
                  {n.kind === "hub" && <circle r={n.r * 0.42} fill={n.color} />}
                  {selected === n.id && <circle r={n.r + 5} fill="none" stroke="#ffd54f" strokeWidth={1.2} />}
                  {showLabel && (
                    <text
                      y={n.kind === "hub" ? n.r + 20 : -n.r - 7}
                      textAnchor="middle"
                      fill={n.kind === "fact" ? "#ece8e1" : n.kind === "hub" ? "#ece8e1" : "rgba(236,232,225,.7)"}
                      fontSize={n.kind === "hub" ? 17 : n.kind === "branch" ? 12 : 10.5}
                      fontFamily={n.kind === "hub" ? "var(--font-cormorant)" : "var(--font-manrope)"}
                      fontStyle={n.kind === "hub" ? "italic" : undefined}
                      stroke="#171716"
                      strokeWidth={4}
                      paintOrder="stroke"
                      pointerEvents="none"
                    >
                      {n.locked ? "🔒 " : ""}
                      {n.kind === "fact" && n.label.length > 28 ? n.label.slice(0, 27) + "…" : n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      <p className="pointer-events-none absolute bottom-4 left-5 text-[11px] text-ivory-40">
        Нажмите на Нексус — раскроются ветви · колесо — масштаб · перетаскивание — перемещение
      </p>
    </div>
  );
}

function Sidebar({ expanded, toggle, selected }: { expanded: Set<NexusId>; toggle: (n: NexusId) => void; selected: GNode | null }) {
  const facts = useFoundation((s) => s.nodes);
  const unlocked = useFoundation((s) => s.unlocked);
  return (
    <div className="space-y-7">
      <section>
        <p className="caps mb-4">Нексусы</p>
        <ul className="space-y-3">
          {NEXUSES.map((n, i) => {
            const fill = nexusFill(facts, n.id);
            const locked = !unlocked.includes(n.id);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => toggle(n.id)}
                  aria-pressed={expanded.has(n.id)}
                  className="group w-full text-left disabled:opacity-40"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="serif text-[20px] leading-none transition-colors group-hover:text-sun">
                      {n.title}
                      {locked && <span className="ml-1.5 text-[11px] not-italic text-ivory-40">заблокирован</span>}
                    </span>
                    <span className="text-[11px] text-ivory-40">0{i + 1}</span>
                  </span>
                  <span className="mt-2 block h-px w-full bg-hair">
                    <span className="block h-px origin-left transition-transform duration-[1600ms] ease-[var(--ease-atelier)]" style={{ background: n.color, transform: `scaleX(${fill})` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <p className="caps mb-3">Статус узла</p>
        <ul className="grid grid-cols-2 gap-2 text-[12px] text-ivory-60">
          {Object.values(NODE_STATUS).map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
          <li className="col-span-2 flex items-center gap-2">
            <span className="h-px w-4 bg-sun" />
            жёсткая связь: свойство → боль
          </li>
        </ul>
      </section>

      <section aria-live="polite">
        <p className="caps mb-3">Узел</p>
        {selected ? (
          <div>
            <p className="serif text-[22px] leading-tight">{selected.label}</p>
            <p className="mt-2 text-[12px] text-ivory-60">
              {NEXUSES.find((n) => n.id === selected.nexus)!.latin}
              {selected.status && ` · ${NODE_STATUS[selected.status].label.toLowerCase()}`}
            </p>
            {selected.locked && <p className="mt-3 text-[13px] leading-relaxed text-ivory-60">Откроется, когда агент Рынка подтвердит полноту и объективность данных.</p>}
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-ivory-40">Выберите узел. Ответы из диалога появляются здесь как факты и цепляются к своим веткам.</p>
        )}
      </section>
    </div>
  );
}

export function GraphWindow() {
  const [expanded, setExpanded] = useState<Set<NexusId>>(new Set());
  const [selected, setSelected] = useState<GNode | null>(null);
  const toggle = (id: NexusId) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Window id="graph" eyebrow="Кортекс · единый граф решений" title="Граф проекта" aside={<Sidebar expanded={expanded} toggle={toggle} selected={selected} />}>
      <GraphCanvas expanded={expanded} toggle={toggle} onSelect={setSelected} selected={selected?.id ?? null} />
    </Window>
  );
}
