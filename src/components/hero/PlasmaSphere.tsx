"use client";

import { useEffect, useRef } from "react";
import { useFoundation } from "@/store/foundation";

/**
 * Стеклянная сфера диалога с потоками плазмы (по фото 1).
 * Canvas рисует: тонкое светящееся кольцо, две закрученные ленты из параллельных
 * линий (в местах перекрута — светящаяся «пыль») и вертикальную нить с точками касания.
 * Пока Ментор думает, кольцо расширяется и пульсирует, ленты ускоряются.
 * Геометрия кольца берётся из DOM-элемента [data-sphere].
 */

type Ribbon = { from: number; to: number; seed: number; twist: number; width: number };

// верхний правый и нижний левый потоки, как на референсе
const RIBBONS: Ribbon[] = [
  { from: -1.95, to: 0.55, seed: 1, twist: 2.4, width: 0.3 },
  { from: 1.45, to: 3.95, seed: 2, twist: 2.1, width: 0.27 },
];

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

export function PlasmaSphere() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const LINES = coarse ? 28 : 46;
    const STEPS = coarse ? 80 : 130;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf = 0;
    let visible = true;
    let think = 0; // 0..1, сглаженное «думает»
    let el: Element | null = null;
    let t0 = performance.now();

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cv);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      const t = reduce ? 4 : now / 1000;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      if (!el) el = document.querySelector("[data-sphere]");
      if (!el) return;
      const cr = cv.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const cx = r.left - cr.left + r.width / 2;
      const cy = r.top - cr.top + r.height / 2;
      const R0 = r.width / 2;

      const busy = useFoundation.getState().busy;
      think += ((busy ? 1 : 0) - think) * (1 - Math.exp(-dt * 5));
      const pulse = reduce ? 0 : Math.sin(t * 6) * 0.5 + 0.5;
      const R = R0 * (1 + think * (0.035 + pulse * 0.018));

      // ---- вертикальная нить через центр и точки касания ----
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, cy - R);
      ctx.moveTo(cx, cy + R);
      ctx.lineTo(cx, h);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      for (const y of [cy - R, cy + R]) {
        ctx.beginPath();
        ctx.arc(cx, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- потоки плазмы ----
      ctx.globalCompositeOperation = "lighter";
      const speed = 0.45 + think * 1.1;
      for (const rb of RIBBONS) {
        const span = rb.to - rb.from;
        // форма ленты для всех линий одного шага
        for (let j = 0; j < LINES; j++) {
          const k = (j / (LINES - 1)) * 2 - 1;
          ctx.beginPath();
          for (let s = 0; s <= STEPS; s++) {
            const u = s / STEPS;
            const th0 = rb.from + span * u;
            const env = Math.pow(Math.sin(Math.PI * u), 0.85);
            const base = R * (1.05 + 0.08 * Math.sin(2 * th0 + t * 0.22 + rb.seed) + 0.04 * Math.sin(5 * u + t * 0.4));
            const W = R * rb.width * env * (1 + think * 0.45);
            const phi = rb.twist * Math.PI * u + t * speed + rb.seed;
            const rad = base + W * k * Math.cos(phi);
            const th = th0 + 0.05 * k * Math.sin(phi) * env;
            const x = cx + rad * Math.cos(th);
            const y = cy + rad * Math.sin(th);
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle = `rgba(255,246,248,${(0.09 + 0.13 * (1 - Math.abs(k))) * (0.85 + think * 0.4)})`;
          ctx.lineWidth = 0.75;
          ctx.stroke();
        }
        // светящаяся пыль в местах перекрута ленты
        if (!reduce) {
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          const tick = Math.floor(t * 12);
          for (let s = 0; s <= STEPS; s += 2) {
            const u = s / STEPS;
            const th0 = rb.from + span * u;
            const env = Math.pow(Math.sin(Math.PI * u), 0.85);
            const phi = rb.twist * Math.PI * u + t * speed + rb.seed;
            const fold = 1 - Math.min(1, Math.abs(Math.cos(phi)) / 0.45);
            if (fold <= 0 || env < 0.2) continue;
            const base = R * (1.05 + 0.08 * Math.sin(2 * th0 + t * 0.22 + rb.seed) + 0.04 * Math.sin(5 * u + t * 0.4));
            const W = R * rb.width * env * (1 + think * 0.45);
            const n = Math.round(fold * (coarse ? 9 : 18));
            for (let q = 0; q < n; q++) {
              const hk = hash(rb.seed * 1000 + s * 31 + q * 7 + tick);
              const k = hk * 2 - 1;
              const rad = base + W * k * Math.cos(phi) + (hash(hk * 91 + q) - 0.5) * 6;
              const th = th0 + (hash(hk * 53) - 0.5) * 0.02;
              ctx.globalAlpha = 0.3 + fold * 0.7;
              ctx.fillRect(cx + rad * Math.cos(th), cy + rad * Math.sin(th), 1, 1);
            }
          }
          ctx.globalAlpha = 1;
        }
      }

      // ---- кольцо: тонкое, светящееся; снизу-слева ярче ----
      ctx.globalCompositeOperation = "source-over";
      const grad = ctx.createLinearGradient(cx + R, cy - R, cx - R, cy + R);
      grad.addColorStop(0, "rgba(255,255,255,0.7)");
      grad.addColorStop(1, "rgba(255,255,255,1)");
      ctx.shadowColor = `rgba(255,255,255,${0.55 + think * 0.35})`;
      ctx.shadowBlur = 14 + think * 18 * (0.6 + pulse * 0.4);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      // внутренняя тонкая дуга
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx + R * 0.02, cy - R * 0.01, R * 0.93, Math.PI * 0.62, Math.PI * 1.35);
      ctx.stroke();
      // ореол раздумья
      if (think > 0.02) {
        ctx.strokeStyle = `rgba(255,255,255,${0.35 * think * (1 - pulse)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, R * (1.04 + pulse * 0.05), 0, Math.PI * 2);
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return <canvas ref={canvas} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden />;
}
