"use client";

import { useEffect, useRef, useState } from "react";

type Direction = "ice" | "gold";
type TypePair = "cosmos" | "instrument" | "monolith";

const DIRECTIONS: { id: Direction; name: string; note: string }[] = [
  { id: "ice", name: "Лёд", note: "Стеклянный кристалл, тёплое ядро, неоновые линзы (референс 1)" },
  { id: "gold", name: "Золото", note: "Чёрная пустота, золотые лучи-потоки, белые сферы (референс 2)" },
];
const PAIRS: { id: TypePair; name: string; fonts: string }[] = [
  { id: "cosmos", name: "Космос", fonts: "Unbounded + Golos Text" },
  { id: "instrument", name: "Прибор", fonts: "Tektur + Inter Tight" },
  { id: "monolith", name: "Монолит", fonts: "Geologica (одна семья)" },
];

/* ---------- контраст по WCAG ---------- */
function parseColor(c: string): [number, number, number, number] {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    return [p[0], p[1], p[2], p[3] ?? 1];
  }
  const h = c.trim().replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
}
function lum([r, g, b]: number[]) {
  const f = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(fg: string, bg: string) {
  const b = parseColor(bg);
  const f = parseColor(fg);
  const mix = f.slice(0, 3).map((v, i) => v * f[3] + b[i] * (1 - f[3]));
  const [l1, l2] = [lum(mix), lum(b)].sort((a, z) => z - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

/* ---------- живой эскиз радианта: геодезическая сфера на canvas ---------- */
function RadiantSketch({ direction }: { direction: Direction }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const css = getComputedStyle(cv);
    const glass = css.getPropertyValue("--glass").trim();
    const core = css.getPropertyValue("--core").trim();
    const coreHot = css.getPropertyValue("--core-hot").trim();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // точки на сфере (Фибоначчи) и рёбра между ближайшими — «геодезический» каркас
    const N = 92;
    const pts = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(t) * r, y, Math.sin(t) * r];
    });
    const edges: [number, number][] = [];
    pts.forEach((a, i) =>
      pts.forEach((b, j) => {
        if (j <= i) return;
        const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        if (d < 0.42) edges.push([i, j]);
      }),
    );

    let raf = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const draw = (t: number) => {
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (cv.width !== w * dpr) {
        cv.width = w * dpr;
        cv.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const R = Math.min(w, h) * 0.42;
      const a = reduce ? 0.6 : t * 0.00018;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const tilt = 0.35;
      const proj = pts.map(([x, y, z]) => {
        const x1 = x * ca + z * sa;
        const z1 = -x * sa + z * ca;
        const y1 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
        const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
        return [cx + x1 * R, cy + y1 * R, z2];
      });

      // ядро
      const pulse = reduce ? 1 : 1 + Math.sin(t * 0.0018) * 0.06;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.85 * pulse);
      g.addColorStop(0, coreHot);
      g.addColorStop(0.18, core);
      g.addColorStop(0.55, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // рёбра: задние тусклее
      ctx.strokeStyle = glass;
      for (const [i, j] of edges) {
        const z = (proj[i][2] + proj[j][2]) / 2;
        ctx.globalAlpha = 0.1 + (z + 1) * 0.34;
        ctx.lineWidth = 0.6 + (z + 1) * 0.5;
        ctx.beginPath();
        ctx.moveTo(proj[i][0], proj[i][1]);
        ctx.lineTo(proj[j][0], proj[j][1]);
        ctx.stroke();
      }
      ctx.fillStyle = glass;
      for (const p of proj) {
        ctx.globalAlpha = 0.25 + (p[2] + 1) * 0.35;
        ctx.beginPath();
        ctx.arc(p[0], p[1], 1.2 + (p[2] + 1) * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [direction]);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

/* ---------- линзы Нексусов на орбите ---------- */
const NEXUS = [
  { id: "market", label: "Рынок", x: 14, y: 22 },
  { id: "product", label: "Продукт", x: 86, y: 20 },
  { id: "growth", label: "Рост", x: 90, y: 74 },
  { id: "ops", label: "Операции", x: 10, y: 76 },
  { id: "tech", label: "Разработка", x: 50, y: 95, locked: true },
];

function Glyph({ id }: { id: string }) {
  const p: Record<string, string> = {
    market: "M4 18h16M7 15V9M12 15V5M17 15v-4",
    product: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zM12 12l8-4.5M12 12v9M12 12L4 7.5",
    growth: "M4 17l5-5 4 3 7-8M15 7h5v5",
    ops: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3 2.5-5 5-5s5 2 5 5M11 20c0-3 2.5-5 5-5s5 2 5 5",
    tech: "M8 8l-4 4 4 4M16 8l4 4-4 4M13 6l-2 12",
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={p[id]} />
    </svg>
  );
}

function Specimen({ direction }: { direction: Direction }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[560px]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        {NEXUS.map((n) => (
          <path
            key={n.id}
            d={`M50 50 Q ${(50 + n.x) / 2 + (n.y - 50) * 0.25} ${(50 + n.y) / 2 - (n.x - 50) * 0.25} ${n.x} ${n.y}`}
            fill="none"
            stroke={`var(--nx-${n.id})`}
            strokeOpacity={n.locked ? 0.2 : 0.55}
            strokeWidth={0.3}
            strokeDasharray={n.locked ? "1 1.5" : undefined}
          />
        ))}
      </svg>
      <div className="absolute inset-[14%]">
        <RadiantSketch direction={direction} />
      </div>
      {NEXUS.map((n) => (
        <div key={n.id} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5" style={{ left: `${n.x}%`, top: `${n.y}%`, opacity: n.locked ? 0.45 : 1 }}>
          <span
            className="grid size-12 place-items-center rounded-full border sm:size-14"
            style={{
              color: `var(--nx-${n.id})`,
              borderColor: `color-mix(in oklab, var(--nx-${n.id}) 60%, transparent)`,
              background: "color-mix(in oklab, var(--bg-1) 70%, transparent)",
              boxShadow: `0 0 22px color-mix(in oklab, var(--nx-${n.id}) 35%, transparent), inset 0 0 14px color-mix(in oklab, var(--nx-${n.id}) 18%, transparent)`,
            }}
          >
            <Glyph id={n.id} />
          </span>
          <span className="whitespace-nowrap text-[12px]" style={{ color: "var(--text-2)" }}>
            {n.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------- палитра с контрастом ---------- */
const SWATCHES = [
  ["--bg-0", "Фон"],
  ["--bg-1", "Поверхность"],
  ["--bg-2", "Приподнятая"],
  ["--text", "Текст"],
  ["--text-2", "Текст вторичный"],
  ["--text-3", "Текст служебный"],
  ["--core", "Ядро / CTA"],
  ["--glass", "Грани кристалла"],
  ["--accent-1", "Акцент 1"],
  ["--accent-2", "Акцент 2"],
  ["--accent-3", "Акцент 3"],
] as const;

function Palette({ direction }: { direction: Direction }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    const css = getComputedStyle(ref.current!);
    setVals(Object.fromEntries(SWATCHES.map(([v]) => [v, css.getPropertyValue(v).trim()])));
  }, [direction]);
  const bg = vals["--bg-0"];
  return (
    <div ref={ref} className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {SWATCHES.map(([v, name]) => {
        const c = vals[v];
        const isText = v.startsWith("--text") || v === "--core" || v === "--glass" || v.startsWith("--accent");
        const ratio = c && bg ? contrast(c, bg) : 0;
        return (
          <div key={v} className="overflow-hidden rounded-[var(--r-m)] border" style={{ borderColor: "var(--line)" }}>
            <div className="h-16" style={{ background: `var(${v})` }} />
            <div className="p-3 text-[12px] leading-snug">
              <p style={{ color: "var(--text)" }}>{name}</p>
              <p className="tabular-nums" style={{ color: "var(--text-3)" }}>
                {c?.startsWith("rgba") ? c.replace(/\s/g, "") : c}
              </p>
              {isText && ratio > 0 && (
                <p className="tabular-nums" style={{ color: ratio >= 4.5 ? "var(--text-2)" : "var(--accent-2)" }}>
                  контраст {ratio.toFixed(1)}:1 {ratio >= 7 ? "AAA" : ratio >= 4.5 ? "AA" : ratio >= 3 ? "крупный текст" : "мало"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- движение ---------- */
const MOTION = [
  { name: "Нажатие", token: "--dur-press · --ease-out", dur: "var(--dur-press)", ease: "var(--ease-out)", use: "отклик на клик" },
  { name: "Наведение", token: "--dur-hover · --ease-out", dur: "var(--dur-hover)", ease: "var(--ease-out)", use: "подсветка, курсор" },
  { name: "Интерфейс", token: "--dur-ui · --ease-out", dur: "var(--dur-ui)", ease: "var(--ease-out)", use: "поповеры, подсказки" },
  { name: "Панель", token: "--dur-panel · --ease-drawer", dur: "var(--dur-panel)", ease: "var(--ease-drawer)", use: "окна графа, файлов" },
  { name: "Сцена", token: "--dur-scene · --ease-scene", dur: "var(--dur-scene)", ease: "var(--ease-scene)", use: "проявления, заставка" },
];

function MotionDemo() {
  const [on, setOn] = useState(false);
  return (
    <div>
      <button type="button" className="btn btn-glass mb-6" onClick={() => setOn((v) => !v)}>
        Проиграть
      </button>
      <ul className="space-y-4">
        {MOTION.map((m) => (
          <li key={m.name} className="grid grid-cols-[minmax(0,140px)_1fr] items-center gap-4 sm:grid-cols-[200px_1fr]">
            <div className="text-[13px]">
              <p>{m.name}</p>
              <p style={{ color: "var(--text-3)" }}>{m.use}</p>
            </div>
            <div className="relative h-10 rounded-[var(--r-pill)] border" style={{ borderColor: "var(--line)" }}>
              <span
                className="absolute left-1 top-1 size-8 rounded-full"
                style={{
                  background: "var(--core)",
                  boxShadow: "var(--glow-core)",
                  transform: on ? "translateX(calc(min(60vw, 520px) - 48px))" : "translateX(0)",
                  transition: `transform ${m.dur} ${m.ease}`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-[12px] leading-relaxed" style={{ color: "var(--text-3)" }}>
        Пружины (Framer Motion): «щелчок» stiffness 520 / damping 34, «мягкая» 180 / 22, «магнит» курсора 300 / 20 / mass 0.6.
      </p>
    </div>
  );
}

/* ---------- переключатель ---------- */
function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; name: string }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1 rounded-[var(--r-pill)] border p-1" style={{ borderColor: "var(--line)" }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className="rounded-[var(--r-pill)] px-3 py-1.5 text-[13px] transition-colors duration-150"
          style={value === o.id ? { background: "var(--core)", color: "var(--core-ink)" } : { color: "var(--text-2)" }}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}

export default function Lab() {
  const [direction, setDirection] = useState<Direction>("ice");
  const [pair, setPair] = useState<TypePair>("cosmos");
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const d = q.get("d") as Direction | null;
    const t = q.get("t") as TypePair | null;
    if (d && DIRECTIONS.some((x) => x.id === d)) setDirection(d);
    if (t && PAIRS.some((x) => x.id === t)) setPair(t);
  }, []);
  const dir = DIRECTIONS.find((d) => d.id === direction)!;
  const tp = PAIRS.find((p) => p.id === pair)!;

  return (
    <main className="ds min-h-screen overflow-x-hidden" data-direction={direction} data-type={pair}>
      <div className="pointer-events-none fixed inset-0" style={{ background: "var(--space-tint)" }} aria-hidden />

      <header className="sticky top-0 z-10 border-b backdrop-blur-xl" style={{ borderColor: "var(--line)", background: "color-mix(in oklab, var(--bg-0) 75%, transparent)" }}>
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-4 py-3 sm:px-8">
          <p className="mr-auto text-[13px]" style={{ color: "var(--text-2)" }}>
            Дизайн-система · тест
          </p>
          <Segmented label="Палитра" value={direction} options={DIRECTIONS} onChange={setDirection} />
          <Segmented label="Шрифты" value={pair} options={PAIRS} onChange={setPair} />
        </div>
      </header>

      <div className="relative mx-auto max-w-[1280px] px-4 sm:px-8">
        {/* образец героя */}
        <section className="grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <p className="mb-5 text-[13px]" style={{ color: "var(--text-3)" }}>
              {dir.name}: {dir.note}. Шрифты: {tp.fonts}.
            </p>
            <h1 className="display" style={{ fontSize: "var(--fs-display-xl)" }}>
              Ментор, который не даст строить ненужное
            </h1>
            <p className="mt-6 max-w-[46ch]" style={{ fontSize: "var(--fs-body-l)", lineHeight: "var(--lh-text)", color: "var(--text-2)" }}>
              Проверяет гипотезы, собирает знания проекта в граф и пускает в разработку, только когда проблема подтверждена.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" className="btn btn-core">
                Попробовать демо
              </button>
              <button type="button" className="btn btn-glass">
                Ранний доступ
              </button>
            </div>
          </div>
          <Specimen direction={direction} />
        </section>

        {/* типографика */}
        <section className="card mb-6 p-6 sm:p-10">
          <h2 className="display mb-8" style={{ fontSize: "var(--fs-h2)" }}>
            Типографика
          </h2>
          <div className="space-y-6">
            <p className="display" style={{ fontSize: "var(--fs-display-l)" }}>
              Съешь ещё этих мягких булок
            </p>
            <p className="display" style={{ fontSize: "var(--fs-h2)" }}>
              Рынок → Продукт → Разработка
            </p>
            <p style={{ fontSize: "var(--fs-h3)" }}>Кто платит и сколько их? CAC 4 000 ₽, LTV 30 000 ₽</p>
            <p className="max-w-[62ch]" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-text)", color: "var(--text-2)" }}>
              Основной текст: Ментор не соглашается, а проверяет. Ответ без цифры или источника он помечает как допущение и переспрашивает.
              Строка держится около 60 знаков, межстрочный интервал 1,55.
            </p>
            <p style={{ fontSize: "var(--fs-small)", color: "var(--text-3)" }}>Подписи и данные: 14 px · 12 px · 0123456789</p>
          </div>
        </section>

        {/* палитра */}
        <section className="card mb-6 p-6 sm:p-10">
          <h2 className="display mb-8" style={{ fontSize: "var(--fs-h2)" }}>
            Палитра
          </h2>
          <Palette direction={direction} />
          <div className="mt-6 flex flex-wrap gap-4 text-[12px]" style={{ color: "var(--text-2)" }}>
            {["market", "product", "growth", "ops", "tech"].map((n) => (
              <span key={n} className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ background: `var(--nx-${n})`, boxShadow: `0 0 10px var(--nx-${n})` }} />
                {{ market: "Рынок", product: "Продукт", growth: "Рост", ops: "Операции", tech: "Разработка" }[n]}
              </span>
            ))}
          </div>
        </section>

        {/* формы и глубина */}
        <section className="card mb-6 p-6 sm:p-10">
          <h2 className="display mb-8" style={{ fontSize: "var(--fs-h2)" }}>
            Радиусы, глубина, свечение
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["--r-s", "10 px — чипы, поля"],
              ["--r-m", "16 px — плашки"],
              ["--r-l", "28 px — окна, карточки"],
              ["--r-pill", "кнопки, линзы"],
            ].map(([r, d]) => (
              <div key={r} className="flex h-28 items-end border p-4 text-[12px]" style={{ borderRadius: `var(${r})`, borderColor: "var(--line-strong)", background: "var(--bg-1)", color: "var(--text-2)" }}>
                {d}
              </div>
            ))}
            <div className="flex h-28 items-end p-4 text-[12px]" style={{ borderRadius: "var(--r-l)", background: "var(--bg-2)", boxShadow: "var(--shadow-raise)", color: "var(--text-2)" }}>
              Приподнятая поверхность
            </div>
            <div className="flex h-28 items-end p-4 text-[12px]" style={{ borderRadius: "var(--r-l)", background: "var(--core)", boxShadow: "var(--glow-core)", color: "var(--core-ink)" }}>
              Свечение ядра
            </div>
            <div className="flex h-28 items-end border p-4 text-[12px]" style={{ borderRadius: "var(--r-l)", borderColor: "var(--glass)", boxShadow: "var(--glow-glass)", background: "color-mix(in oklab, var(--bg-2) 55%, transparent)", backdropFilter: "blur(14px)", color: "var(--text-2)" }}>
              Стекло
            </div>
          </div>
        </section>

        {/* движение */}
        <section className="card mb-16 p-6 sm:p-10">
          <h2 className="display mb-8" style={{ fontSize: "var(--fs-h2)" }}>
            Движение
          </h2>
          <MotionDemo />
        </section>
      </div>
    </main>
  );
}
