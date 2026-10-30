import { PROJECT_STAGE_OPTIONS } from "@/content/copy";
import { Icon } from "@/components/ui/Icon";

/**
 * Сцена 7 — главный CTA. Фаза 1: разметка формы.
 * Фаза 7: отправка в Route Handler → Google Sheets webhook, валидация, аналитика.
 */
export function EarlyAccess() {
  return (
    <section id="access" aria-labelledby="access-title" className="relative overflow-hidden py-20 lg:py-28">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{ background: "radial-gradient(50% 60% at 30% 60%, rgba(255,201,60,.10), transparent 70%)" }}
      />
      <div className="container-x grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-8">
        <div className="glass rounded-[var(--radius-lg)] p-6 sm:p-10">
          <p className="eyebrow mb-3">Ранний доступ</p>
          <h2 id="access-title" className="font-display text-[clamp(26px,3.4vw,40px)] font-semibold leading-tight tracking-tight">
            Сейчас набираем первую когорту фаундеров
          </h2>
          <p className="mt-3 text-ink-2">Оставьте контакт — напишем, когда откроем доступ, и спросим, что для вас важнее всего.</p>

          <form className="mt-8 grid gap-4" noValidate>
            <div className="grid gap-1.5">
              <label htmlFor="ea-contact" className="text-sm text-ink-2">
                Email или Telegram
              </label>
              <input
                id="ea-contact"
                name="contact"
                required
                autoComplete="email"
                placeholder="you@mail.ru или @username"
                className="h-12 rounded-xl border border-line-strong bg-void/60 px-4 text-ink placeholder:text-ink-3 focus:border-sun focus:outline-none"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="ea-stage" className="text-sm text-ink-2">
                На какой стадии проект
              </label>
              <select
                id="ea-stage"
                name="stage"
                defaultValue=""
                className="h-12 appearance-none rounded-xl border border-line-strong bg-void/60 px-4 text-ink focus:border-sun focus:outline-none"
              >
                <option value="" disabled>
                  Выберите стадию
                </option>
                {PROJECT_STAGE_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="ea-pain" className="text-sm text-ink-2">
                Что сейчас самое трудное
              </label>
              <input
                id="ea-pain"
                name="pain"
                maxLength={160}
                placeholder="Одной строкой"
                className="h-12 rounded-xl border border-line-strong bg-void/60 px-4 text-ink placeholder:text-ink-3 focus:border-sun focus:outline-none"
              />
            </div>
            <button type="submit" className="btn-sun mt-2 w-full sm:w-auto sm:justify-self-start">
              Хочу ранний доступ
            </button>
            <p className="text-xs text-ink-3">Только для связи о запуске. Без рассылок.</p>
          </form>
        </div>

        <aside className="flex flex-col gap-6 rounded-[var(--radius-lg)] border border-sun/30 bg-sun/[0.05] p-6 sm:p-10" aria-labelledby="cohort-title">
          <div>
            <p className="eyebrow mb-3 !text-sun">Первая когорта</p>
            <h3 id="cohort-title" className="font-display text-2xl font-semibold leading-tight">
              Забронировать место
            </h3>
            <p className="mt-3 leading-relaxed text-ink-2">
              Работаем с небольшой группой фаундеров вручную: созвоны с командой, ранние версии Ментора и влияние на то, что мы строим.
            </p>
          </div>
          <ul className="space-y-3 text-sm">
            {["Личный онбординг и разбор идеи", "Ранний доступ ко всем агентам", "Цена первой когорты навсегда"].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <Icon name="check" size={18} className="mt-0.5 shrink-0 text-sun" />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-auto">
            <button type="button" className="btn-ghost w-full border-sun/50 text-sun hover:bg-sun/10">
              Забронировать место в первой когорте
            </button>
            <p className="mt-3 text-xs leading-relaxed text-ink-3">Оплата сейчас не списывается. Мы свяжемся для подтверждения.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
