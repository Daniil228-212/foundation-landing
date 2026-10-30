import { HOW_STEPS } from "@/content/copy";
import { GraphPreview } from "./GraphPreview";

/**
 * Сцена 5 — скролл-сторителлинг.
 * Фаза 1: sticky-визуал + список шагов. В фазе 6 — GSAP pin, граф собирается по шагам.
 */
export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="relative py-20 lg:py-28">
      <div className="container-x">
        <header className="mb-12 max-w-[60ch]">
          <p className="eyebrow mb-3">Как это работает</p>
          <h2 id="how-title" className="font-display text-[clamp(26px,3.6vw,44px)] font-semibold leading-tight tracking-tight">
            Сначала доказательства, потом код
          </h2>
        </header>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:h-[min(70vh,560px)]" aria-hidden>
            <div className="glass h-full overflow-hidden rounded-[var(--radius-lg)]">
              <GraphPreview className="h-[280px] w-full lg:h-full" />
            </div>
          </div>

          <ol className="flex flex-col gap-6 lg:gap-[22vh] lg:py-[10vh]">
            {HOW_STEPS.map((s) => (
              <li key={s.n} className="max-w-[46ch]">
                <span className="font-display text-sm text-sun">{s.n}</span>
                <h3 className="font-display mt-2 text-[clamp(20px,2.2vw,28px)] font-semibold leading-tight">{s.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
