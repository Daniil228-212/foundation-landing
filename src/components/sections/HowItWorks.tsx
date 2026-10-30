import { HOW_STEPS } from "@/content/copy";

/**
 * Скролл-сторителлинг. Сейчас — разметка и позиции блоков;
 * GSAP-пин и сборка графа по шагам — фаза 6.
 */
export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="relative border-t border-hair py-24 lg:py-36">
      <div className="container-x grid gap-14 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
        <header className="lg:sticky lg:top-32 lg:self-start">
          <p className="caps mb-5">Метод</p>
          <h2 id="how-title" className="serif text-[clamp(40px,5.4vw,76px)] leading-[0.98]">
            Сначала доказательства, <em>потом код</em>
          </h2>
          <p className="mt-6 max-w-[42ch] text-[15px] leading-relaxed text-ivory-60">
            Жизненный цикл продукта — это последовательность рисков. Ментор снимает их по порядку и не даёт перепрыгнуть через этап.
          </p>
        </header>

        <ol className="divide-y divide-hair border-y border-hair">
          {HOW_STEPS.map((s) => (
            <li key={s.n} className="grid grid-cols-[56px_1fr] gap-4 py-10 sm:grid-cols-[96px_1fr] sm:py-12">
              <span className="serif text-[clamp(28px,3vw,40px)] italic text-ivory-40">{s.n}</span>
              <div>
                <h3 className="serif text-[clamp(26px,2.6vw,36px)] leading-tight">{s.title}</h3>
                <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-ivory-60">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
