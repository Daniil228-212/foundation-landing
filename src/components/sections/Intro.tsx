import { HERO_VARIANTS, type HeroVariant } from "@/content/copy";

/**
 * Сцена 1 — заставка.
 * Фаза 1: статичный космос (он же фолбэк для reduced-motion / слабого GPU).
 * Фаза 2: сюда лениво подгрузится WebGL-сцена частиц поверх этого фона.
 * LCP — текстовый заголовок, он рендерится на сервере.
 */
export function Intro({ variant = "A" }: { variant?: HeroVariant }) {
  const copy = HERO_VARIANTS[variant];
  return (
    <section id="top" aria-labelledby="hero-title" className="noise relative isolate flex min-h-[100svh] items-center overflow-hidden">
      <div className="space-fallback absolute inset-0 -z-10" aria-hidden />
      <div className="starfield absolute inset-0 -z-10 opacity-70" aria-hidden />
      {/* место под портал, в который «соберутся» частицы */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[58%] -z-10 aspect-square w-[min(70vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60"
        style={{ background: "radial-gradient(circle, rgba(255,201,60,.18), rgba(255,201,60,0) 65%)" }}
      />

      <div className="container-x pt-24 pb-28 text-center">
        <p className="eyebrow mb-6">ИИ-ментор для инди-фаундеров</p>
        <h1
          id="hero-title"
          className="font-display mx-auto max-w-[17ch] text-[clamp(32px,6.2vw,84px)] font-semibold leading-[1.02] tracking-[-0.02em] text-balance"
        >
          {copy.title}
        </h1>
        <p className="mx-auto mt-6 max-w-[56ch] text-[clamp(16px,1.6vw,20px)] leading-relaxed text-ink-2 text-pretty">
          {copy.subtitle}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href="#mentor" className="btn-sun w-full sm:w-auto">
            Попробовать за 60 секунд
          </a>
          <a href="#access" className="btn-ghost w-full sm:w-auto">
            Ранний доступ
          </a>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-8 flex justify-center" aria-hidden>
        <div className="flex flex-col items-center gap-2 text-xs text-ink-3">
          <span>Листайте</span>
          <span className="h-10 w-px bg-gradient-to-b from-ink-3 to-transparent" />
        </div>
      </div>
    </section>
  );
}
