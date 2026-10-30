import { NEXUSES, NODE_STATUS } from "@/content/nexus";
import { Icon } from "@/components/ui/Icon";
import { GraphPreview } from "./GraphPreview";

function Block({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={`glass flex flex-col rounded-[var(--radius)] p-5 ${className}`}>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-ink-2">
        <Icon name={icon} size={18} className="text-sun" />
        {title}
      </h3>
      {children}
    </article>
  );
}

const DOCS = [
  { t: "Скрипт проблемного интервью", s: "Discovery" },
  { t: "Юнит-экономика — черновик", s: "Рост" },
  { t: "PRD v0", s: "Delivery · заблокирован", locked: true },
];

const SOURCES = [
  { t: "«Борода продакта» — С. Тихомиров", s: "Product Architecture Framework" },
  { t: "Хабр", s: "Разработка, продукт" },
  { t: "vc.ru", s: "Кейсы запусков" },
];

const NEXT = ["Построить дерево метрик", "Приоритизировать по ICE / RICE", "Переформатировать в PRD"];

function MentorPanel() {
  return (
    <aside aria-label="ИИ-ассистент проекта" className="glass flex flex-col rounded-[var(--radius)] p-5 lg:row-span-3">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium text-ink-2">
          <span className="size-2 rounded-full bg-st-ok" aria-hidden /> Ментор
        </h3>
        <span className="text-xs text-ink-3">этап: Рынок</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 text-[15px] leading-relaxed">
        <p className="rounded-2xl rounded-bl-md bg-white/[0.06] p-4">
          CAC 1 200 ₽ — это допущение: вы не назвали канал. Без канала юнит-экономика не считается.
        </p>

        <div className="rounded-2xl border border-st-check/30 bg-st-check/[0.06] p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-st-check">Что нужно узнать</p>
          <ul className="space-y-1.5 text-sm text-ink-2">
            <li>— Где ваши клиенты ищут решение сейчас</li>
            <li>— Сколько стоит один контакт в этом канале</li>
            <li>— Какая доля доходит до оплаты</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-st-fail/30 bg-st-fail/[0.06] p-4 text-sm text-ink-2">
          <span className="font-medium text-st-fail">Не доказано: </span>
          «всем барбершопам нужна запись онлайн». Двое из пяти опрошенных уже пользуются YCLIENTS.
        </div>

        <div className="mt-auto">
          <p className="mb-2 text-xs text-ink-3">Что дальше</p>
          <ul className="flex flex-wrap gap-2">
            {NEXT.map((n) => (
              <li key={n}>
                <button type="button" className="rounded-full border border-line-strong px-3 py-1.5 text-xs text-ink transition-colors hover:border-sun hover:text-sun">
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 rounded-full border border-line p-1.5 pl-4">
        <label htmlFor="cortex-input" className="sr-only">
          Вопрос ассистенту
        </label>
        <input id="cortex-input" placeholder="Спросите о проекте…" className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-ink-3 focus:outline-none" />
        <button type="button" className="btn-sun !min-h-9 !w-9 !p-0" aria-label="Отправить">
          <Icon name="send" size={16} />
        </button>
      </div>
    </aside>
  );
}

export function Cortex() {
  return (
    <section id="cortex" aria-labelledby="cortex-title" className="relative py-20 lg:py-28">
      <div className="container-x">
        <header className="mb-10 max-w-[60ch]">
          <p className="eyebrow mb-3">Кортекс · единый граф решений</p>
          <h2 id="cortex-title" className="font-display text-[clamp(26px,3.6vw,44px)] font-semibold leading-tight tracking-tight">
            Всё, что вы узнали о проекте, — в одной базе
          </h2>
          <p className="mt-4 text-ink-2">
            Гипотезы, интервью, документы и цифры связываются в граф. Из него работают агенты, и каждый видит только свою часть.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_1fr_minmax(320px,0.9fr)] lg:grid-rows-[auto_auto_auto]">
          {/* граф */}
          <Block title="Граф текущих задач" icon="graph" className="lg:col-span-2">
            <div className="relative -mx-2 overflow-hidden rounded-2xl bg-void/60">
              <GraphPreview className="h-[260px] w-full sm:h-[360px] lg:h-[420px]" />
              <button type="button" className="btn-ghost absolute bottom-3 right-3 !min-h-9 bg-space/80 !px-4 text-xs lg:hidden">
                Развернуть граф
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-2">
              {NEXUSES.map((n) => (
                <span key={n.id} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full" style={{ background: n.color }} aria-hidden />
                  {n.title}
                  <span className="text-ink-3">· {n.latin}</span>
                </span>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-3">
              {Object.values(NODE_STATUS).map((s) => (
                <span key={s.label} className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm" style={{ background: s.color }} aria-hidden />
                  {s.label}
                </span>
              ))}
            </div>
          </Block>

          <MentorPanel />

          <Block title="Документы" icon="doc">
            <ul className="space-y-2">
              {DOCS.map((d) => (
                <li key={d.t} className={`flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ${d.locked ? "opacity-50" : ""}`}>
                  <span className="text-sm">{d.t}</span>
                  <span className="shrink-0 text-xs text-ink-3">{d.s}</span>
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Источники инсайтов" icon="source">
            <p className="mb-3 text-xs text-ink-3">ИИ опирается на них в первую очередь</p>
            <ul className="space-y-2">
              {SOURCES.map((s) => (
                <li key={s.t} className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                  <span className="block text-sm">{s.t}</span>
                  <span className="text-xs text-ink-3">{s.s}</span>
                </li>
              ))}
              <li>
                <button type="button" className="w-full rounded-xl border border-dashed border-line-strong px-3 py-2.5 text-left text-sm text-ink-3 hover:text-ink">
                  + Добавить автора или сайт
                </button>
              </li>
            </ul>
          </Block>

          <Block title="Таблицы" icon="table">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Пример: юнит-экономика</caption>
              <thead className="text-xs text-ink-3">
                <tr>
                  <th className="pb-2 font-normal">Метрика</th>
                  <th className="pb-2 text-right font-normal">Значение</th>
                  <th className="pb-2 text-right font-normal">Статус</th>
                </tr>
              </thead>
              <tbody className="[&_td]:border-t [&_td]:border-line [&_td]:py-2">
                <tr>
                  <td>CAC</td>
                  <td className="text-right tabular-nums">1 200 ₽</td>
                  <td className="text-right text-st-assume">допущение</td>
                </tr>
                <tr>
                  <td>ARPU / мес</td>
                  <td className="text-right tabular-nums">890 ₽</td>
                  <td className="text-right text-st-check">проверяется</td>
                </tr>
                <tr>
                  <td>Retention M3</td>
                  <td className="text-right tabular-nums">—</td>
                  <td className="text-right text-ink-3">нет данных</td>
                </tr>
              </tbody>
            </table>
          </Block>

          <Block title="Фото и сканы" icon="photo">
            <div className="flex gap-3">
              <div
                className="aspect-[4/3] w-28 shrink-0 rounded-xl"
                style={{ background: "repeating-linear-gradient(135deg,#1c2560 0 12px,#141b45 12px 24px)" }}
                role="img"
                aria-label="Фото доски со стикерами"
              />
              <div className="text-sm">
                <p>Доска после воркшопа</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-3">Распознано 6 стикеров → 4 гипотезы добавлены в «Продукт · Discovery»</p>
              </div>
            </div>
          </Block>
        </div>
      </div>
    </section>
  );
}
