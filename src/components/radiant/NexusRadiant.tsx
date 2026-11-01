"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PAF_NEXUSES, PAF_NODES, type PafNexusId } from "@/content/pafNexus";

/* ------------------------------------------------------------------
   Радиант-Кортекс: геодезическая сфера вокруг тёплого ядра. Её точки —
   узлы Нексусов PAF. Крупнее узел — крупнее точка и виднее подпись;
   мелкие узлы и подписи проявляются при приближении.
   Вращение свободное (трекбол на кватернионах) — без «полюсов».
------------------------------------------------------------------- */

export type RadiantFact = { pafId: string; label: string; status: "assume" | "check" | "ok" | "fail" };
export type RadiantSelection = { id: string; label: string; nexus: PafNexusId; path: string[]; facts: RadiantFact[] } | null;

type V3 = [number, number, number];
type Q = [number, number, number, number]; // x, y, z, w
type Node = {
  id: string;
  label: string;
  nexus: PafNexusId | null; // null — «пыль» кристалла
  parent: string | null;
  level: number; // 0 — Нексус, 1.. — глубина, -1 — пыль
  r: number; // базовый радиус точки, px при масштабе 1
  pos: V3;
  phase: number;
  color: string;
};

const GLASS = "#8fe9ff";
const CORE = "#ffe3a3";
const CORE_HOT = "#fff4da";
const LINK = "#ffd27a";
const STATUS: Record<RadiantFact["status"], string> = { assume: "#8d93a8", check: "#ffd54f", ok: "#7ee0a1", fail: "#ff7a7a" };
const COLOR = Object.fromEntries(PAF_NEXUSES.map((n) => [n.id, n.color])) as Record<PafNexusId, string>;
const ZOOM_MIN = 0.85;
const ZOOM_MAX = 4;
const ZOOM_FOCUS_MAX = 2.2;

/* ---------- векторы и кватернионы ---------- */
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const qAxis = (axis: V3, ang: number): Q => {
  const s = Math.sin(ang / 2);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(ang / 2)];
};
const qMul = (a: Q, b: Q): Q => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const qNorm = (q: Q): Q => {
  const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
};
const qRot = (q: Q, v: V3): V3 => {
  const u: V3 = [q[0], q[1], q[2]];
  const t = cross(u, v).map((x) => x * 2) as V3;
  const c = cross(u, t);
  return [v[0] + q[3] * t[0] + c[0], v[1] + q[3] * t[1] + c[1], v[2] + q[3] * t[2] + c[2]];
};
const qFromTo = (a: V3, b: V3): Q => {
  const d = dot(a, b);
  if (d > 0.99999) return [0, 0, 0, 1];
  if (d < -0.99999) return qAxis([0, 1, 0], Math.PI);
  const c = cross(a, b);
  return qNorm([c[0], c[1], c[2], 1 + d]);
};
const qLerp = (a: Q, b: Q, t: number): Q => {
  const s = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3] < 0 ? -1 : 1;
  return qNorm([a[0] + (b[0] * s - a[0]) * t, a[1] + (b[1] * s - a[1]) * t, a[2] + (b[2] * s - a[2]) * t, a[3] + (b[3] * s - a[3]) * t]);
};

/** точка на сфере на угловом расстоянии d от p в направлении угла a */
function around(p: V3, d: number, a: number): V3 {
  const up: V3 = Math.abs(p[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const t1 = norm(cross(p, up));
  const t2 = cross(p, t1);
  const s = Math.sin(d);
  const c = Math.cos(d);
  return norm([
    p[0] * c + (t1[0] * Math.cos(a) + t2[0] * Math.sin(a)) * s,
    p[1] * c + (t1[1] * Math.cos(a) + t2[1] * Math.sin(a)) * s,
    p[2] * c + (t1[2] * Math.cos(a) + t2[2] * Math.sin(a)) * s,
  ]);
}
function angleTo(p: V3, q: V3): number {
  const up: V3 = Math.abs(p[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const t1 = norm(cross(p, up));
  const t2 = cross(p, t1);
  return Math.atan2(dot(q, t2), dot(q, t1));
}

/* ---------- раскладка: Нексусы в вершинах тетраэдра, ветви — веером наружу ---------- */
function buildGraph() {
  const HUB_DIR: Record<PafNexusId, V3> = {
    market: norm([-1, 0.9, 0.9]),
    product: norm([1, 0.9, -0.6]),
    growth: norm([1, -0.9, 0.9]),
    company: norm([-1, -0.9, -0.7]),
  };
  const byId = new Map(PAF_NODES.map((n) => [n.id, n]));
  const kids = new Map<string, string[]>();
  PAF_NODES.forEach((n) => n.parent && kids.set(n.parent, [...(kids.get(n.parent) ?? []), n.id]));
  const descCount = (id: string): number => (kids.get(id) ?? []).reduce((s, k) => s + 1 + descCount(k), 0);
  const level = (id: string): number => {
    const p = byId.get(id)!.parent;
    return p ? 1 + level(p) : 0;
  };

  // детерминированная «случайность» — одинаковая картинка при каждой загрузке
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  const pos = new Map<string, V3>();
  const STEP = [0, 0.6, 0.27, 0.17, 0.13];
  const place = (id: string) => {
    const n = byId.get(id)!;
    const lv = level(id);
    if (lv === 0) pos.set(id, HUB_DIR[n.nexus]);
    const children = kids.get(id) ?? [];
    const p = pos.get(id)!;
    const gp = n.parent ? pos.get(n.parent)! : null;
    const outward = gp ? angleTo(p, gp) + Math.PI : 0.4;
    children.forEach((c, i) => {
      const spread = lv === 0 ? (Math.PI * 2) / children.length : 0.75;
      const a = lv === 0 ? outward + i * spread : outward + (i - (children.length - 1) / 2) * spread;
      pos.set(c, around(p, STEP[Math.min(lv + 1, 4)], a));
      place(c);
    });
  };
  PAF_NEXUSES.forEach((h) => place(h.id));

  const nodes: Node[] = PAF_NODES.map((n) => {
    const lv = level(n.id);
    const d = descCount(n.id);
    const r = lv === 0 ? 9 : lv === 1 ? Math.min(6.4, 3.4 + d * 0.5) : lv === 2 ? Math.min(4.2, 2.5 + d * 0.45) : 1.9;
    return { id: n.id, label: n.label, nexus: n.nexus, parent: n.parent, level: lv, r, pos: pos.get(n.id)!, phase: rnd() * 6.28, color: COLOR[n.nexus] };
  });

  for (let it = 0; it < 80; it++) {
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const min = 0.035 + (a.r + b.r) * 0.0085;
        const d = Math.acos(clamp(dot(a.pos, b.pos), -1, 1));
        if (d < min) {
          const push = (min - d) * 0.5;
          const dir = norm([a.pos[0] - b.pos[0], a.pos[1] - b.pos[1], a.pos[2] - b.pos[2]]);
          const wa = a.level === 0 ? 0 : 1;
          const wb = b.level === 0 ? 0 : 1;
          a.pos = norm([a.pos[0] + dir[0] * push * wa, a.pos[1] + dir[1] * push * wa, a.pos[2] + dir[2] * push * wa]);
          b.pos = norm([b.pos[0] - dir[0] * push * wb, b.pos[1] - dir[1] * push * wb, b.pos[2] - dir[2] * push * wb]);
        }
      }
  }

  const N = 120;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const rr = Math.sqrt(1 - y * y);
    const t = i * Math.PI * (3 - Math.sqrt(5));
    const p: V3 = [Math.cos(t) * rr, y, Math.sin(t) * rr];
    if (nodes.some((n) => n.level >= 0 && dot(n.pos, p) > Math.cos(0.13))) continue;
    nodes.push({ id: `dust-${i}`, label: "", nexus: null, parent: null, level: -1, r: 1.1, pos: p, phase: rnd() * 6.28, color: GLASS });
  }

  const idx = new Map(nodes.map((n, i) => [n.id, i]));
  const tree: [number, number][] = [];
  nodes.forEach((n, i) => n.parent && tree.push([idx.get(n.parent)!, i]));
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);
  const seen = new Set(tree.map(([a, b]) => key(a, b)));
  const mesh: [number, number][] = [];
  nodes.forEach((a, i) => {
    nodes
      .map((b, j) => ({ j, d: dot(a.pos, b.pos) }))
      .filter((x) => x.j !== i)
      .sort((x, y) => y.d - x.d)
      .slice(0, 3)
      .forEach(({ j, d }) => {
        if (d < Math.cos(0.42)) return;
        const k = key(i, j);
        if (!seen.has(k)) {
          seen.add(k);
          mesh.push([i, j]);
        }
      });
  });
  const crossLinks: [number, number][] = [];
  PAF_NODES.forEach((n) => n.links?.forEach((l) => idx.has(l) && crossLinks.push([idx.get(n.id)!, idx.get(l)!])));

  const children = new Map<number, number[]>();
  tree.forEach(([p, c]) => children.set(p, [...(children.get(p) ?? []), c]));
  const subtree = (i: number): number[] => (children.get(i) ?? []).flatMap((c) => [c, ...subtree(c)]);

  return { nodes, tree, mesh, crossLinks, idx, children, subtree };
}

/* ---------- компонент ---------- */
export function NexusRadiant({
  facts = [],
  onSelect,
  focusRequest,
  showHint = true,
}: {
  facts?: RadiantFact[];
  onSelect?: (s: RadiantSelection) => void;
  /** внешний запрос фокуса: меняйте `n`, чтобы повторить */
  focusRequest?: { id: string | null; n: number };
  showHint?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const graph = useMemo(buildGraph, []);
  const [touched, setTouched] = useState(false);
  const [changed, setChanged] = useState(false);
  const [announce, setAnnounce] = useState("");
  const factsRef = useRef(facts);
  factsRef.current = facts;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const ctrl = useRef({
    q: qMul(qAxis([1, 0, 0], 0.18), qAxis([0, 1, 0], 0.5)),
    spinAxis: [0, 1, 0] as V3,
    spin: 0, // рад/кадр после отпускания
    zoom: 1,
    target: null as null | { q: Q; zoom: number },
    hover: -1,
    focus: -1,
    dragging: false,
    idleAt: 0,
  });

  const pathOf = (i: number) => {
    const out: string[] = [];
    let n: Node | undefined = graph.nodes[i];
    while (n) {
      out.unshift(n.label);
      n = n.parent ? graph.nodes[graph.idx.get(n.parent)!] : undefined;
    }
    return out;
  };

  const focusNode = (id: string | null) => {
    const c = ctrl.current;
    setChanged(true);
    if (!id) {
      c.focus = -1;
      c.target = { q: c.q, zoom: 1 };
      setAnnounce("");
      onSelectRef.current?.(null);
      return;
    }
    const i = graph.idx.get(id);
    if (i === undefined) return;
    const n = graph.nodes[i];
    // поворот кратчайшим путём: узел — к зрителю
    const delta = qFromTo(norm(qRot(c.q, n.pos)), [0, 0, 1]);
    // масштаб — чтобы вся ветка узла помещалась в кадр
    const sub = graph.subtree(i);
    const spread = sub.reduce((m, k) => Math.max(m, Math.acos(clamp(dot(n.pos, graph.nodes[k].pos), -1, 1))), 0.22);
    const zoom = clamp(0.36 / (0.36 * Math.sin(Math.min(spread, 1.35)) * 1.35), 1, ZOOM_FOCUS_MAX);
    c.focus = i;
    c.spin = 0;
    c.target = { q: qMul(delta, c.q), zoom };
    const path = pathOf(i);
    setAnnounce(path.join(" → "));
    onSelectRef.current?.({ id: n.id, label: n.label, nexus: n.nexus!, path, facts: factsRef.current.filter((f) => f.pafId === n.id) });
  };

  useEffect(() => {
    if (focusRequest) focusNode(focusRequest.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest?.n]);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = ctrl.current;
    const { nodes, tree, mesh, crossLinks, children, subtree } = graph;
    const proj = nodes.map(() => ({ x: 0, y: 0, z: 0, s: 1 }));
    const labelBoxes: { i: number; box: [number, number, number, number] }[] = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf = 0;
    let last = performance.now();
    const fontLabel = getComputedStyle(cv).getPropertyValue("--font-label").trim() || "system-ui, sans-serif";

    const ancestors = (i: number) => {
      const out: number[] = [];
      let n = nodes[i];
      while (n?.parent) {
        const p = graph.idx.get(n.parent)!;
        out.push(p);
        n = nodes[p];
      }
      return out;
    };
    const withLinks = (s: Set<number>) => {
      crossLinks.forEach(([a, b]) => {
        if (s.has(a)) s.add(b);
        else if (s.has(b)) s.add(a);
      });
      return s;
    };
    // фокус: вся ветка + путь до Нексуса; наведение: путь + прямые потомки
    const focusSet = (i: number) => withLinks(new Set([i, ...ancestors(i), ...subtree(i)]));
    const hoverSet = (i: number) => withLinks(new Set([i, ...ancestors(i), ...(children.get(i) ?? [])]));

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // ---- камера ----
      if (c.target) {
        const k = reduce ? 1 : 1 - Math.exp(-dt * 4);
        c.q = qLerp(c.q, c.target.q, k);
        c.zoom += (c.target.zoom - c.zoom) * k;
        const qd = Math.abs(c.q[0] * c.target.q[0] + c.q[1] * c.target.q[1] + c.q[2] * c.target.q[2] + c.q[3] * c.target.q[3]);
        if (Math.abs(c.target.zoom - c.zoom) < 0.002 && qd > 0.99999) c.target = null;
      } else if (!c.dragging) {
        if (Math.abs(c.spin) > 1e-5) {
          c.q = qNorm(qMul(qAxis(c.spinAxis, c.spin), c.q));
          c.spin *= 0.92;
        }
        // спокойное вращение вокруг вертикали, пока никто не трогает и ничего не выбрано
        if (!reduce && now - c.idleAt > 2500 && c.focus < 0) c.q = qNorm(qMul(qAxis([0, 1, 0], dt * 0.07), c.q));
      }

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * (w < h ? 0.44 : 0.36) * c.zoom;
      const D = 3.4;
      const t = now / 1000;

      nodes.forEach((n, i) => {
        const breathe = reduce ? 1 : 1 + Math.sin(t * 1.1 + n.phase) * 0.01 + Math.sin(t * 0.7) * 0.006;
        const [x, y, z] = qRot(c.q, n.pos);
        const s = D / (D - z * breathe);
        proj[i].x = cx + x * breathe * R * s;
        proj[i].y = cy - y * breathe * R * s;
        proj[i].z = z;
        proj[i].s = s;
      });

      const focused = c.focus >= 0;
      const hl = focused ? focusSet(c.focus) : c.hover >= 0 ? hoverSet(c.hover) : null;
      const hovered = !focused && c.hover >= 0 ? c.hover : -1;
      const depth = (z: number) => 0.18 + ((z + 1) / 2) * 0.82;
      const factBy = new Map<string, RadiantFact[]>();
      factsRef.current.forEach((f) => factBy.set(f.pafId, [...(factBy.get(f.pafId) ?? []), f]));

      const drawEdges = (front: boolean) => {
        ctx.lineCap = "round";
        // каркас кристалла: при выборе узла уходит в фон, чтобы не путать
        for (const [a, b] of mesh) {
          const z = (proj[a].z + proj[b].z) / 2;
          if (z >= 0 !== front) continue;
          ctx.globalAlpha = depth(z) * 0.32 * (focused ? 0.06 : hl ? 0.35 : 1);
          ctx.strokeStyle = GLASS;
          ctx.lineWidth = 0.5 + depth(z) * 0.5;
          ctx.beginPath();
          ctx.moveTo(proj[a].x, proj[a].y);
          ctx.lineTo(proj[b].x, proj[b].y);
          ctx.stroke();
        }
        for (const [a, b] of tree) {
          const z = (proj[a].z + proj[b].z) / 2;
          if (z >= 0 !== front) continue;
          const on = !hl || (hl.has(a) && hl.has(b));
          if (focused && !on) continue;
          ctx.globalAlpha = (focused ? Math.max(0.45, depth(z)) : depth(z)) * (on ? (hl ? 0.95 : 0.55) : 0.1);
          ctx.strokeStyle = nodes[b].color;
          ctx.lineWidth = (nodes[a].level === 0 ? 1.5 : 1.1) * (0.6 + depth(z) * 0.6);
          ctx.beginPath();
          ctx.moveTo(proj[a].x, proj[a].y);
          ctx.lineTo(proj[b].x, proj[b].y);
          ctx.stroke();
        }
      };

      const drawPoints = (front: boolean) => {
        nodes.forEach((n, i) => {
          const p = proj[i];
          if (p.z >= 0 !== front) return;
          const on = !hl || hl.has(i);
          const tw = reduce ? 1 : 0.85 + Math.sin(t * 2 + n.phase * 3) * 0.15;
          const rad = n.r * Math.min(c.zoom, 2.4) ** 0.55 * p.s * (n.level < 0 ? 1 : tw * 0.15 + 0.85);
          const a = (focused && on ? Math.max(0.55, depth(p.z)) : depth(p.z)) * (on ? 1 : focused ? 0.1 : 0.22);
          if (n.level >= 0 && n.level <= 1) {
            const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 4.5);
            g.addColorStop(0, n.color);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalAlpha = a * (n.level === 0 ? 0.55 : 0.3);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad * 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = a * (n.level < 0 ? 0.75 * tw : 1);
          ctx.fillStyle = n.level === 0 ? "#ffffff" : n.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
          ctx.fill();
          if (n.level === 0) {
            ctx.globalAlpha = a;
            ctx.strokeStyle = n.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad + 3.5, 0, Math.PI * 2);
            ctx.stroke();
          }
          // факты из диалога: кольцо цвета статуса
          const f = factBy.get(n.id);
          if (f?.length) {
            // у погашенных при выборе узлов кольцо тоже гаснет
            ctx.globalAlpha = focused && !on ? a : Math.max(a, 0.6);
            ctx.strokeStyle = STATUS[f[f.length - 1].status];
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad + (n.level === 0 ? 8 : 4), 0, Math.PI * 2);
            ctx.stroke();
          }
          if (i === c.focus || i === hovered) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = CORE;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad + 7, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      };

      drawEdges(false);
      drawPoints(false);

      const pulse = reduce ? 1 : 1 + Math.sin(t * 1.6) * 0.05;
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.78 * pulse);
      core.addColorStop(0, CORE_HOT);
      core.addColorStop(0.16, CORE);
      core.addColorStop(0.42, "rgba(255,227,163,0.22)");
      core.addColorStop(1, "rgba(255,227,163,0)");
      // при выборе и приближении ядро приглушается, чтобы не засвечивать узлы
      ctx.globalAlpha = (focused ? 0.28 : hl ? 0.7 : 1) / c.zoom ** 0.9;
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.78 * pulse, 0, Math.PI * 2);
      ctx.fill();

      drawEdges(true);
      drawPoints(true);

      if (hl) {
        ctx.setLineDash([3, 5]);
        for (const [a, b] of crossLinks) {
          if (!(hl.has(a) && hl.has(b))) continue;
          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = LINK;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(proj[a].x, proj[a].y);
          ctx.lineTo(proj[b].x, proj[b].y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // ---- подписи ----
      labelBoxes.length = 0;
      const placed: [number, number, number, number][] = [];
      const order = nodes
        .map((n, i) => ({ n, i }))
        .filter(({ n }) => n.level >= 0)
        .sort((a, b) => Number(b.i === c.focus || b.i === hovered) - Number(a.i === c.focus || a.i === hovered) || (hl ? Number(hl.has(b.i)) - Number(hl.has(a.i)) : 0) || b.n.r - a.n.r);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const { n, i } of order) {
        const p = proj[i];
        const inSet = hl?.has(i) ?? false;
        const hasFact = factBy.has(n.id);
        let alpha = n.level === 0 ? 1 : clamp((c.zoom * n.r - 3.6) / 5);
        if (hasFact) alpha = Math.max(alpha, 0.75);
        alpha *= clamp((p.z + 0.2) / 0.55);
        if (inSet) alpha = Math.max(alpha, p.z > -0.35 ? 1 : 0.45);
        else if (hl) alpha *= focused ? 0.08 : 0.3;
        if (alpha < 0.04) continue;
        const size = n.level === 0 ? 16 : n.level === 1 ? 12.5 : 11;
        ctx.font = `400 ${size}px ${fontLabel}`;
        const tw = ctx.measureText(n.label).width;
        const rad = n.r * Math.min(c.zoom, 2.4) ** 0.55 * p.s;
        const ly = p.y + (n.level === 0 ? rad + 18 : -(rad + 10));
        const lx = clamp(p.x, tw / 2 + 10, w - tw / 2 - 10);
        const box: [number, number, number, number] = [lx - tw / 2 - 4, ly - size / 2 - 2, lx + tw / 2 + 4, ly + size / 2 + 2];
        const mustShow = i === c.focus || i === hovered;
        if (!mustShow && placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
        placed.push(box);
        if (alpha > 0.35 && p.z > -0.2) labelBoxes.push({ i, box });
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(3,5,11,0.88)";
        ctx.strokeText(n.label, lx, ly);
        ctx.fillStyle = n.level === 0 ? n.color : "#eaf4ff";
        ctx.fillText(n.label, lx, ly);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    /* ---------- ввод ---------- */
    const pointers = new Map<number, { x: number; y: number }>();
    let start = { x: 0, y: 0, moved: false };
    let pinch0 = 0;
    let zoom0 = 1;
    let lastTap = 0;
    // щедрое попадание: точка, её окрестность или подпись
    const hit = (x: number, y: number) => {
      const r = cv.getBoundingClientRect();
      const px = x - r.left;
      const py = y - r.top;
      for (let k = labelBoxes.length - 1; k >= 0; k--) {
        const b = labelBoxes[k].box;
        if (px >= b[0] && px <= b[2] && py >= b[1] && py <= b[3]) return labelBoxes[k].i;
      }
      let best = -1;
      let bd = 1e9;
      nodes.forEach((n, i) => {
        if (n.level < 0 || proj[i].z < -0.1) return;
        const d = Math.hypot(proj[i].x - px, proj[i].y - py);
        const lim = Math.max(18, n.r * 2.2 + 10);
        const score = d - n.r * 1.5 - proj[i].z * 6;
        if (d < lim && score < bd) {
          bd = score;
          best = i;
        }
      });
      return best;
    };
    const down = (e: PointerEvent) => {
      cv.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      start = { x: e.clientX, y: e.clientY, moved: false };
      c.dragging = true;
      c.spin = 0;
      c.idleAt = performance.now();
      setTouched(true);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch0 = Math.hypot(a.x - b.x, a.y - b.y);
        zoom0 = c.zoom;
      }
    };
    const move = (e: PointerEvent) => {
      if (!c.dragging) {
        c.hover = hit(e.clientX, e.clientY);
        cv.style.cursor = c.hover >= 0 ? "pointer" : "grab";
        return;
      }
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        c.target = null;
        c.zoom = clamp((zoom0 * Math.hypot(a.x - b.x, a.y - b.y)) / pinch0, ZOOM_MIN, ZOOM_MAX);
        start.moved = true;
        setChanged(true);
        return;
      }
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) start.moved = true;
      if (!start.moved) return;
      c.target = c.target ? { q: c.q, zoom: c.target.zoom } : null;
      // трекбол: ось перпендикулярна движению; при приближении вращение медленнее
      const len = Math.hypot(dx, dy);
      if (len > 0) {
        const axis = norm([dy, dx, 0]);
        const ang = (len * 0.0055) / c.zoom ** 1.15;
        c.q = qNorm(qMul(qAxis(axis, ang), c.q));
        c.spinAxis = axis;
        c.spin = ang;
      }
      cv.style.cursor = "grabbing";
      setChanged(true);
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size > 0) return;
      c.dragging = false;
      c.idleAt = performance.now();
      if (!start.moved) {
        c.spin = 0;
        const i = hit(e.clientX, e.clientY);
        const now = performance.now();
        if (i >= 0) focusNode(nodes[i].id);
        else if (now - lastTap < 320) focusNode(null); // двойной клик по пустому месту — исходный вид
        lastTap = now;
      }
      if (e.pointerType !== "mouse") c.hover = -1;
    };
    const leave = () => {
      if (!c.dragging) c.hover = -1;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (c.target) c.target = { q: c.target.q, zoom: c.zoom };
      c.zoom = clamp(c.zoom * Math.exp(-e.deltaY * 0.001), ZOOM_MIN, ZOOM_MAX);
      if (c.target) c.target.zoom = c.zoom;
      c.idleAt = performance.now();
      setTouched(true);
      setChanged(true);
    };
    const key = (e: KeyboardEvent) => e.key === "Escape" && focusNode(null);
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    cv.addEventListener("pointerleave", leave);
    cv.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", down);
      cv.removeEventListener("pointermove", move);
      cv.removeEventListener("pointerup", up);
      cv.removeEventListener("pointercancel", up);
      cv.removeEventListener("pointerleave", leave);
      cv.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph]);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvas}
        className="absolute inset-0 h-full w-full touch-none select-none"
        style={{ cursor: "grab" }}
        role="img"
        aria-label="Радиант: четыре Нексуса — рынка, продукта, роста и компании — и их узлы на поверхности кристалла"
      />

      {/* клавиатура и скринридеры: те же узлы списком; фокус выбирает узел на сфере */}
      <nav aria-label="Узлы Нексусов" className="sr-only">
        {PAF_NEXUSES.map((nx) => (
          <ul key={nx.id} aria-label={nx.full}>
            {PAF_NODES.filter((n) => n.nexus === nx.id).map((n) => (
              <li key={n.id}>
                <button type="button" onFocus={() => focusNode(n.id)} onClick={() => focusNode(n.id)}>
                  {n.label}
                </button>
              </li>
            ))}
          </ul>
        ))}
      </nav>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {changed && (
        <button
          type="button"
          onClick={() => {
            focusNode(null);
            setChanged(false);
          }}
          aria-label="Вернуть исходный вид"
          title="Исходный вид (Esc)"
          className="absolute bottom-[max(20px,env(safe-area-inset-bottom))] right-5 grid size-11 place-items-center rounded-full border text-[#eaf4ff] transition-transform duration-150 active:scale-95"
          style={{ borderColor: "rgba(143,233,255,.3)", background: "rgba(10,16,32,.6)", backdropFilter: "blur(12px)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
          </svg>
        </button>
      )}
      {showHint && (
        <p
          className="pointer-events-none absolute inset-x-0 bottom-[max(24px,env(safe-area-inset-bottom))] text-center text-[12px] transition-opacity duration-700"
          style={{ color: "rgba(234,244,255,.5)", opacity: touched ? 0 : 1 }}
          aria-hidden
        >
          Приближайте и вращайте
        </p>
      )}
    </div>
  );
}
