import { PROJECT_STAGE_OPTIONS } from "@/content/copy";

/**
 * Главный CTA. Сейчас — разметка; отправка в Route Handler, валидация и аналитика — фаза 7.
 * Никаких выдуманных цифр и отзывов: честный блок доверия.
 */
const field =
  "h-14 w-full border-0 border-b border-hair-strong bg-transparent px-0 text-[16px] font-light text-ivory placeholder:text-ivory-40 focus:border-ivory focus:outline-none transition-colors";

export function EarlyAccess() {
  return (
    <section id="access" aria-labelledby="access-title" className="relative border-t border-hair py-24 lg:py-36">
      <div className="container-x grid gap-16 lg:grid-cols-[1.1fr_1fr] lg:gap-24">
        <div>
          <p className="caps mb-5">Ранний доступ</p>
          <h2 id="access-title" className="serif text-[clamp(40px,5.4vw,76px)] leading-[0.98]">
            Набираем первую <em>когорту</em> фаундеров
          </h2>
          <p className="mt-6 max-w-[44ch] text-[15px] leading-relaxed text-ivory-60">
            Оставьте контакт — напишем, когда откроем доступ, и спросим, что для вас важнее всего.
          </p>

          <div className="mt-14 rounded-[28px] border border-sun/40 p-7 sm:p-9" style={{ background: "radial-gradient(120% 100% at 0% 0%, rgba(255,213,79,.08), transparent 60%)" }}>
            <h3 className="serif text-[30px] leading-none">Забронировать место</h3>
            <p className="mt-4 max-w-[46ch] text-[14px] leading-relaxed text-ivory-60">
              Небольшая группа, ручной онбординг, ранние версии всех агентов и цена первой когорты навсегда.
            </p>
            <button type="button" className="btn-atelier mt-7 border-sun/60 text-sun">
              Забронировать место в первой когорте
            </button>
            <p className="mt-4 text-[12px] text-ivory-40">Оплата сейчас не списывается. Мы свяжемся для подтверждения.</p>
          </div>
        </div>

        <form className="flex flex-col gap-8 lg:pt-24" noValidate>
          <div>
            <label htmlFor="ea-contact" className="caps">
              Email или Telegram
            </label>
            <input id="ea-contact" name="contact" required autoComplete="email" placeholder="you@mail.ru или @username" className={field} />
          </div>
          <div>
            <label htmlFor="ea-stage" className="caps">
              Стадия проекта
            </label>
            <select id="ea-stage" name="stage" defaultValue="" className={`${field} appearance-none`}>
              <option value="" disabled>
                Выберите
              </option>
              {PROJECT_STAGE_OPTIONS.map((o) => (
                <option key={o} className="bg-graphite">
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ea-pain" className="caps">
              Что сейчас самое трудное
            </label>
            <input id="ea-pain" name="pain" maxLength={160} placeholder="Одной строкой" className={field} />
          </div>
          <button type="submit" className="btn-atelier btn-atelier--sun mt-2 self-start">
            Хочу ранний доступ
          </button>
          <p className="text-[12px] text-ivory-40">Только для связи о запуске. Без рассылок.</p>
        </form>
      </div>
    </section>
  );
}
