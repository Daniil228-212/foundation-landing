"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PAF_NEXUSES, PAF_NODES, type PafNexusId } from "@/content/pafNexus";

/* ------------------------------------------------------------------
   Радиант-Кортекс: геодезическая сфера, обволакивающая тёплое ядро.
   Её точки — узлы Нексусов PAF. Крупнее узел — крупнее точка и виднее
   подпись; мелкие узлы и подписи проявляются при приближении.
------------------------------------------------------------------- */

type V3 = [number, number, number];
type Node = {
  id: string;
  label: string;
  nexus: PafNexusId | null; // null — «пыль» кристалла
  parent: string | null;
  level: number; // 0 — Нексус, 1.. — глубина, -1 — пыль
  desc: number;
  r: number; // базовый радиус точки, px при масштабе 1
  pos: V3;
  phase: number;
  color: string;
};

const GLASS = "#8fe9ff";
const CORE = "#ffe3a3";
const CORE_HOT = "#fff4da";
const LINK = "#ffd27a";
const COLOR: Record<PafNexusId, string> = Object.fromEntries(PAF_NEXUSES.map((n) => [n.id, n.color])) as Record<PafNexusId, string>;
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

/* ---------- векторная мелочь ---------- */
const norm = (v: V3): V3 => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** точка на сфере на угловом расстоянии d от p в направлении угла a в касательной плоскости */
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
/** угол направления q относительно p в касательной плоскости p */
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

  const nodes: Node[] = [];
  const pos = new Map<string, V3>();
  const STEP = [0, 0.6, 0.27, 0.17, 0.13];
  const place = (id: string) => {
    const n = byId.get(id)!;
    const lv = level(id);
    if (lv === 0) pos.set(id, HUB_DIR[n.nexus]);
    const children = kids.get(id) ?? [];
    const p = pos.get(id)!;
    // направление «наружу» от прародителя, чтобы ветви не загибались назад
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

  PAF_NODES.forEach((n) => {
    const lv = level(n.id);
    const d = descCount(n.id);
    const r = lv === 0 ? 9 : lv === 1 ? Math.min(6.4, 3.4 + d * 0.5) : lv === 2 ? Math.min(4.2, 2.5 + d * 0.45) : 1.9;
    nodes.push({ id: n.id, label: n.label, nexus: n.nexus, parent: n.parent, level: lv, desc: d, r, pos: pos.get(n.id)!, phase: Math.random() * 6.28, color: COLOR[n.nexus] });
  });

  // расталкивание по поверхности, чтобы точки не слипались
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

  // «пыль» кристалла — заполняет пустоты, сохраняя геодезический силуэт
  const N = 120;
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const rr = Math.sqrt(1 - y * y);
    const t = i * Math.PI * (3 - Math.sqrt(5));
    const p: V3 = [Math.cos(t) * rr, y, Math.sin(t) * rr];
    if (nodes.some((n) => n.level >= 0 && dot(n.pos, p) > Math.cos(0.13))) continue;
    nodes.push({ id: `dust-${i}`, label: "", nexus: null, parent: null, level: -1, desc: 0, r: 1.1, pos: p, phase: Math.random() * 6.28, color: GLASS });
  }

  // рёбра: дерево Нексуса + каркас кристалла (3 ближайших) + связи между Нексусами
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
  const cross_: [number, number][] = [];
  PAF_NODES.forEach((n) => n.links?.forEach((l) => idx.has(l) && cross_.push([idx.get(n.id)!, idx.get(l)!])));

  return { nodes, tree, mesh, cross: cross_, idx };
}

/* ---------- компонент ---------- */
export function NexusRadiant() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const graph = useMemo(buildGraph, []);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const ctrl = useRef({
    rotY: 0.5,
    rotX: 0.18,
    vY: 0,
    vX: 0,
    zoom: 1,
    target: null as null | { rotY: number; rotX: number; zoom: number },
    hover: -1,
    focus: -1,
    panX: 0,
    panY: 0,
    dragging: false,
    idleAt: 0,
  });

  const nodePath = (i: number) => {
    const out: string[] = [];
    let n = graph.nodes[i];
    while (n) {
      out.unshift(n.label);
      n = n.parent ? graph.nodes[graph.idx.get(n.parent)!] : (undefined as unknown as Node);
    }
    return out.join(" → ");
  };

  const focusNode = (id: string | null) => {
    const c = ctrl.current;
    setFocusId(id);
    if (!id) {
      c.focus = -1;
      c.target = { rotY: c.rotY, rotX: 0.18, zoom: 1 };
      return;
    }
    const i = graph.idx.get(id)!;
    const n = graph.nodes[i];
    const [x, y, z] = n.pos;
    let ry = Math.atan2(-x, z);
    // кратчайший поворот
    while (ry - c.rotY > Math.PI) ry -= Math.PI * 2;
    while (ry - c.rotY < -Math.PI) ry += Math.PI * 2;
    const rx = Math.atan2(y, Math.hypot(x, z));
    // поворот со сдвигом: узел не перекрывает ядро, панорама поставит его в центр
    ry += 0.55;
    c.focus = i;
    c.target = { rotY: ry, rotX: rx, zoom: [1.9, 2.6, 3.3, 3.8][Math.min(n.level, 3)] };
  };

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c = ctrl.current;
    const { nodes, tree, mesh, cross: crossLinks } = graph;
    const proj = nodes.map(() => ({ x: 0, y: 0, z: 0, s: 1 }));
    const children = new Map<number, number[]>();
    tree.forEach(([p, ch]) => children.set(p, [...(children.get(p) ?? []), ch]));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf = 0;
    let last = performance.now();
    const fontText = getComputedStyle(cv).getPropertyValue("--font-label").trim() || "system-ui, sans-serif";

    const highlightSet = (i: number) => {
      const s = new Set<number>([i]);
      let n = nodes[i];
      while (n?.parent) {
        const p = graph.idx.get(n.parent)!;
        s.add(p);
        n = nodes[p];
      }
      (children.get(i) ?? []).forEach((k) => s.add(k));
      crossLinks.forEach(([a, b]) => {
        if (a === i) s.add(b);
        if (b === i) s.add(a);
      });
      return s;
    };

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

      // ---- движение камеры ----
      if (c.target) {
        const k = reduce ? 1 : 1 - Math.exp(-dt * 4.5);
        c.rotY += (c.target.rotY - c.rotY) * k;
        c.rotX += (c.target.rotX - c.rotX) * k;
        c.zoom += (c.target.zoom - c.zoom) * k;
        if (Math.abs(c.target.zoom - c.zoom) < 0.002 && Math.abs(c.target.rotY - c.rotY) < 0.002) c.target = null;
      } else if (!c.dragging) {
        c.rotY += c.vY;
        c.rotX = clamp(c.rotX + c.vX, -1.25, 1.25);
        c.vY *= 0.94;
        c.vX *= 0.94;
        const idle = now - c.idleAt > 2500;
        if (!reduce && idle && c.focus < 0) c.rotY += dt * 0.07;
      }

      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * (w < h ? 0.44 : 0.36) * c.zoom;
      const D = 3.4;
      const sy = Math.sin(c.rotY);
      const cyR = Math.cos(c.rotY);
      const sx = Math.sin(c.rotX);
      const cxR = Math.cos(c.rotX);
      const t = now / 1000;

      nodes.forEach((n, i) => {
        const breathe = reduce ? 1 : 1 + Math.sin(t * 1.1 + n.phase) * 0.01 + Math.sin(t * 0.7) * 0.006;
        const [x, y, z] = n.pos;
        const x1 = x * cyR + z * sy;
        const z1 = -x * sy + z * cyR;
        const y2 = y * cxR - z1 * sx;
        const z2 = y * sx + z1 * cxR;
        const s = D / (D - z2 * breathe);
        proj[i].x = cx + x1 * breathe * R * s;
        proj[i].y = cy - y2 * breathe * R * s;
        proj[i].z = z2;
        proj[i].s = s;
      });

      // панорама: выбранный узел плавно встаёт в центр экрана
      {
        const k = reduce ? 1 : 1 - Math.exp(-dt * 4.5);
        const tx = c.focus >= 0 ? cx - proj[c.focus].x : 0;
        const ty = c.focus >= 0 ? cy - proj[c.focus].y : 0;
        c.panX += (tx - c.panX) * k;
        c.panY += (ty - c.panY) * k;
        for (const p of proj) {
          p.x += c.panX;
          p.y += c.panY;
        }
      }
      const ox = cx + c.panX;
      const oy = cy + c.panY;

      const focusIdx = c.hover >= 0 ? c.hover : c.focus;
      const hl = focusIdx >= 0 ? highlightSet(focusIdx) : null;
      const depth = (z: number) => 0.18 + ((z + 1) / 2) * 0.82;

      const drawEdges = (front: boolean) => {
        ctx.lineCap = "round";
        for (const [a, b] of mesh) {
          const z = (proj[a].z + proj[b].z) / 2;
          if (z >= 0 !== front) continue;
          ctx.globalAlpha = depth(z) * 0.32 * (hl ? 0.35 : 1);
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
          ctx.globalAlpha = depth(z) * (on ? (hl ? 0.95 : 0.55) : 0.12);
          ctx.strokeStyle = nodes[b].color;
          ctx.lineWidth = (nodes[a].level === 0 ? 1.4 : 1) * (0.6 + depth(z) * 0.6);
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
          const a = depth(p.z) * (on ? 1 : 0.22);
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
          if (i === c.focus) {
            ctx.globalAlpha = 1;
            ctx.strokeStyle = CORE;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad + 7, 0, Math.PI * 2);
            ctx.stroke();
          }
        });
      };

      // задняя половина → ядро → передняя половина
      drawEdges(false);
      drawPoints(false);

      const pulse = reduce ? 1 : 1 + Math.sin(t * 1.6) * 0.05;
      const core = ctx.createRadialGradient(ox, oy, 0, ox, oy, R * 0.78 * pulse);
      core.addColorStop(0, CORE_HOT);
      core.addColorStop(0.16, CORE);
      core.addColorStop(0.42, "rgba(255,227,163,0.22)");
      core.addColorStop(1, "rgba(255,227,163,0)");
      // при приближении ядро приглушается, чтобы не засвечивать узлы
      ctx.globalAlpha = (hl ? 0.7 : 1) / c.zoom ** 0.9;
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(ox, oy, R * 0.78 * pulse, 0, Math.PI * 2);
      ctx.fill();

      drawEdges(true);
      drawPoints(true);

      // связи между Нексусами — только для выделенного узла
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

      // ---- подписи: видимость = размер × масштаб × «лицом к зрителю», без наложений ----
      const placed: [number, number, number, number][] = [];
      const order = nodes
        .map((n, i) => ({ n, i }))
        .filter(({ n }) => n.level >= 0)
        .sort((a, b) => (hl ? Number(hl.has(b.i)) - Number(hl.has(a.i)) : 0) || b.n.r - a.n.r);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const { n, i } of order) {
        const p = proj[i];
        const forced = hl?.has(i) ?? false;
        let alpha = n.level === 0 ? 1 : clamp((c.zoom * n.r - 3.6) / 5);
        alpha *= clamp((p.z + 0.2) / 0.55);
        if (forced) alpha = Math.max(alpha, p.z > -0.35 ? 1 : 0.5);
        else if (hl) alpha *= 0.3;
        if (alpha < 0.04) continue;
        const size = n.level === 0 ? 17 : n.level === 1 ? 13 : 11.5;
        ctx.font = `${n.level === 0 ? 500 : 400} ${size}px ${fontText}`;
        const tw = ctx.measureText(n.label).width;
        const rad = n.r * Math.min(c.zoom, 2.4) ** 0.55 * p.s;
        const ly = p.y + (n.level === 0 ? rad + 18 : -(rad + 10));
        const lx = clamp(p.x, tw / 2 + 10, w - tw / 2 - 10);
        const box: [number, number, number, number] = [lx - tw / 2 - 4, ly - size / 2 - 2, lx + tw / 2 + 4, ly + size / 2 + 2];
        if (!forced && placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) continue;
        placed.push(box);
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(3,5,11,0.85)";
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
    const hit = (x: number, y: number) => {
      const r = cv.getBoundingClientRect();
      const px = x - r.left;
      const py = y - r.top;
      let best = -1;
      let bd = 1e9;
      nodes.forEach((n, i) => {
        if (n.level < 0 || proj[i].z < -0.25) return;
        const d = Math.hypot(proj[i].x - px, proj[i].y - py);
        const lim = n.r * 1.6 + 9;
        if (d < lim && d - proj[i].z * 4 < bd) {
          bd = d - proj[i].z * 4;
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
      c.target = null;
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
        c.zoom = clamp((zoom0 * Math.hypot(a.x - b.x, a.y - b.y)) / pinch0, ZOOM_MIN, ZOOM_MAX);
        start.moved = true;
        return;
      }
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) start.moved = true;
      const k = 0.006 / Math.sqrt(c.zoom);
      c.vY = dx * k;
      c.vX = dy * k;
      c.rotY += c.vY;
      c.rotX = clamp(c.rotX + c.vX, -1.25, 1.25);
      cv.style.cursor = "grabbing";
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size > 0) return;
      c.dragging = false;
      c.idleAt = performance.now();
      if (!start.moved) {
        const i = hit(e.clientX, e.clientY);
        c.vX = c.vY = 0;
        if (i >= 0) focusNode(nodes[i].id);
        else focusNode(null);
      }
      if (e.pointerType !== "mouse") c.hover = -1;
      setZoomed(c.zoom > 1.05);
    };
    const leave = () => {
      if (!c.dragging) c.hover = -1;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      c.target = null;
      c.zoom = clamp(c.zoom * Math.exp(-e.deltaY * 0.0012), ZOOM_MIN, ZOOM_MAX);
      c.idleAt = performance.now();
      setTouched(true);
      setZoomed(c.zoom > 1.05);
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

  const focused = focusId ? graph.idx.get(focusId) : undefined;

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvas}
        className="absolute inset-0 h-full w-full touch-none select-none"
        style={{ cursor: "grab" }}
        role="img"
        aria-label="Радиант: четыре Нексуса — рынка, продукта, роста и компании — и их узлы на поверхности кристалла"
      />

      {/* клавиатура и скринридеры: те же узлы списком; фокус подсвечивает узел на сфере */}
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
        {focused !== undefined ? nodePath(focused) : ""}
      </p>

      {(zoomed || focusId) && (
        <button
          type="button"
          onClick={() => {
            focusNode(null);
            setZoomed(false);
          }}
          aria-label="Вернуть исходный вид"
          className="absolute bottom-[max(20px,env(safe-area-inset-bottom))] right-5 grid size-11 place-items-center rounded-full border text-[#eaf4ff] transition-transform duration-150 active:scale-95"
          style={{ borderColor: "rgba(143,233,255,.3)", background: "rgba(10,16,32,.6)", backdropFilter: "blur(12px)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
          </svg>
        </button>
      )}
      <p
        className="pointer-events-none absolute inset-x-0 bottom-[max(24px,env(safe-area-inset-bottom))] text-center text-[12px] transition-opacity duration-700"
        style={{ color: "rgba(234,244,255,.5)", opacity: touched ? 0 : 1 }}
        aria-hidden
      >
        Приближайте и вращайте
      </p>
    </div>
  );
}
