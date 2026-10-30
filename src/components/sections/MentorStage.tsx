import { AGENTS, WORKSPACE_ACTIONS } from "@/content/agents";
import { STAGES } from "@/content/copy";
import { Mascot, MascotPaws } from "@/components/mascot/Mascot";
import { MiniAgent } from "@/components/mascot/MiniAgent";
import { Icon } from "@/components/ui/Icon";

/** Статичная демо-реплика для фазы 1. В фазе 4 её заменит XState-автомат. */
const SAMPLE = [
  { from: "mentor", text: "Привет, я Ментор. Опишите идею одной фразой, а я задам три неудобных вопроса." },
  { from: "user", text: "Приложение для онлайн-записи в барбершопы" },
  { from: "mentor", text: "Кто платит: барбершоп или клиент? И сколько таких барбершопов в вашем городе?" },
] as const;

const QUICK_IDEAS = ["Соцсеть для…", "SaaS для бизнеса", "Маркетплейс", "Мобильное приложение"];

function Bubble({ from, text }: { from: "mentor" | "user"; text: string }) {
  const mentor = from === "mentor";
  return (
    <div className={`flex ${mentor ? "justify-start" : "justify-end"}`}>
      <p
        className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-[15px] leading-snug ${
          mentor ? "rounded-bl-md bg-white/[0.07] text-ink" : "rounded-br-md bg-sun text-sun-ink"
        }`}
      >
        {mentor && <span className="sr-only">Ментор: </span>}
        {text}
      </p>
    </div>
  );
}

function StageStepper() {
  return (
    <ol className="flex items-center justify-center gap-2 text-xs" aria-label="Этапы проверки идеи">
      {STAGES.map((s, i) => {
        const active = i === 0;
        const locked = s.id === "tech";
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${
                active
                  ? "border-sun/60 bg-sun/10 text-sun"
                  : locked
                    ? "border-line text-ink-3"
                    : "border-line text-ink-2"
              }`}
            >
              {locked && <Icon name="lock" size={12} />}
              {s.title}
            </span>
            {i < STAGES.length - 1 && <span className="h-px w-4 bg-line-strong sm:w-8" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

function ChatInput() {
  return (
    <form className="glass flex w-full items-center gap-2 rounded-full p-1.5 pl-5" aria-label="Сообщение Ментору">
      <label htmlFor="mentor-input" className="sr-only">
        Опишите вашу идею
      </label>
      <input
        id="mentor-input"
        type="text"
        autoComplete="off"
        placeholder="Опишите идею одной фразой…"
        className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink placeholder:text-ink-3 focus:outline-none"
      />
      <button type="submit" className="btn-sun !min-h-11 !w-11 shrink-0 !p-0" aria-label="Отправить">
        <Icon name="send" size={18} />
      </button>
    </form>
  );
}

/** Окно-портал: маскот за окном, лапы — поверх кромки */
function Portal() {
  return (
    <div className="relative mx-auto aspect-square w-[min(88vw,400px)] lg:w-[min(58vh,540px)]">
      {/* окно */}
      <div className="absolute inset-0 overflow-hidden rounded-full" style={{ background: "radial-gradient(circle at 50% 35%, #18215a 0%, #0a0f2c 55%, #050716 100%)" }}>
        <div className="starfield absolute inset-0 opacity-50" aria-hidden />
        {/* диалог внутри окна — только на десктопе, на мобильном он под окном */}
        <div
          className="absolute inset-x-[15%] top-[9%] hidden h-[35%] flex-col justify-end gap-2 overflow-hidden lg:flex"
          style={{ maskImage: "linear-gradient(to bottom, transparent, #000 28%)" }}
          aria-live="polite"
          aria-label="Диалог с Ментором"
        >
          {SAMPLE.map((m, i) => (
            <Bubble key={i} from={m.from} text={m.text} />
          ))}
        </div>
        {/* маскот позади окна; на мобильном крупнее */}
        <Mascot className="absolute left-[16%] top-[34%] w-[68%] lg:left-[21%] lg:top-[45%] lg:w-[58%]" />
      </div>
      {/* кромка */}
      <div className="portal-rim pointer-events-none absolute inset-0 rounded-full" aria-hidden />
      {/* лапы поверх кромки — тот же бокс, что и у маскота */}
      <MascotPaws className="pointer-events-none absolute left-[16%] top-[34%] w-[68%] lg:left-[21%] lg:top-[45%] lg:w-[58%]" />
    </div>
  );
}

function ToolsRail() {
  return (
    <aside aria-label="Инструменты и агенты" className="hidden lg:block">
      <p className="eyebrow mb-4">Инструменты</p>
      <ul className="flex flex-col gap-2">
        {AGENTS.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className={`glass group flex w-full items-center gap-3 rounded-2xl p-2.5 pr-3 text-left transition-colors hover:border-line-strong ${a.gated ? "opacity-60" : ""}`}
              aria-describedby={`agent-${a.id}-role`}
            >
              <MiniAgent id={a.id} color={a.color} size={44} dim={a.gated} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {a.name}
                  {a.gated && <Icon name="lock" size={12} className="text-ink-3" />}
                </span>
                <span id={`agent-${a.id}-role`} className="block truncate text-xs text-ink-3">
                  {a.tools.map((t) => t.title).join(" · ")}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-3">
        <Icon name="key" size={14} className="mt-0.5 shrink-0" />
        Свой API-ключ Claude или GPT — или инструменты по подписке.
      </p>
    </aside>
  );
}

function ActionsRail({ mobile = false }: { mobile?: boolean }) {
  return (
    <aside aria-label="Рабочее пространство" className={mobile ? "lg:hidden" : "hidden lg:block"}>
      {!mobile && <p className="eyebrow mb-4">Проект</p>}
      <ul className={mobile ? "grid grid-cols-3 gap-2" : "flex flex-col gap-2"}>
        {WORKSPACE_ACTIONS.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              className={`glass flex w-full rounded-2xl text-left transition-colors hover:border-line-strong ${
                mobile ? "flex-col items-start gap-2 p-3" : "items-center gap-3 p-3"
              }`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-sun">
                <Icon name={a.id} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{a.title}</span>
                {!mobile && <span className="block text-xs text-ink-3">{a.hint}</span>}
              </span>
              {a.id === "graph" && !mobile && (
                <span className="ml-auto whitespace-nowrap rounded-full bg-nx-market/15 px-2 py-0.5 text-xs text-nx-market">3 узла</span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {!mobile && (
        <div className="glass mt-3 rounded-2xl border-dashed p-4 text-xs leading-relaxed text-ink-3">
          Перетащите сюда PDF, таблицу, фото или ссылку — разложим по разделам графа.
        </div>
      )}
    </aside>
  );
}

function AgentsRibbon() {
  return (
    <div className="lg:hidden">
      <p className="eyebrow mb-3">Агенты</p>
      <ul className="-mx-[var(--gutter)] flex snap-x gap-2 overflow-x-auto px-[var(--gutter)] pb-2" aria-label="Агенты">
        {AGENTS.map((a) => (
          <li key={a.id} className="snap-start">
            <button
              type="button"
              className={`glass flex w-[132px] flex-col items-center gap-1.5 rounded-2xl p-3 text-center ${a.gated ? "opacity-60" : ""}`}
            >
              <MiniAgent id={a.id} color={a.color} size={48} dim={a.gated} />
              <span className="flex items-center gap-1 text-sm font-medium">
                {a.name}
                {a.gated && <Icon name="lock" size={12} className="text-ink-3" />}
              </span>
              <span className="text-[11px] leading-tight text-ink-3">{a.tools[0].title}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MentorStage() {
  return (
    <section id="mentor" aria-labelledby="mentor-title" className="relative py-20 lg:py-16">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden
        style={{ background: "radial-gradient(50% 45% at 50% 45%, rgba(255,201,60,.07), transparent 70%)" }}
      />
      <div className="container-x">
        <header className="mb-8 text-center">
          <p className="eyebrow mb-3">Демо-сессия · 60 секунд</p>
          <h2 id="mentor-title" className="font-display text-[clamp(26px,3vw,36px)] font-semibold tracking-tight">
            Поговорите с Ментором
          </h2>
        </header>

        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-8 lg:grid-cols-[240px_minmax(0,1fr)_240px] lg:gap-10">
          <ToolsRail />

          <div className="flex flex-col items-center gap-5">
            <StageStepper />
            <Portal />

            {/* мобильный диалог — под окном */}
            <div className="flex w-full flex-col gap-2 lg:hidden" aria-live="polite" aria-label="Диалог с Ментором">
              {SAMPLE.map((m, i) => (
                <Bubble key={i} from={m.from} text={m.text} />
              ))}
            </div>

            <div className="w-full max-w-[520px] space-y-3">
              <ChatInput />
              <ul className="flex flex-wrap justify-center gap-2" aria-label="Примеры идей">
                {QUICK_IDEAS.map((q) => (
                  <li key={q}>
                    <button type="button" className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-2 transition-colors hover:border-line-strong hover:text-ink">
                      {q}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <ActionsRail />
          <div className="space-y-6 lg:hidden">
            <ActionsRail mobile />
            <AgentsRibbon />
          </div>
        </div>
      </div>

      {/* новый проект */}
      <button
        type="button"
        aria-label="Новый проект"
        title="Новый проект"
        className="absolute bottom-6 right-[var(--gutter)] grid size-14 place-items-center rounded-full bg-sun text-sun-ink shadow-[0_10px_40px_-8px_rgba(255,201,60,.6)] transition-transform hover:rotate-90 max-lg:hidden"
      >
        <Icon name="plus" size={24} />
      </button>
    </section>
  );
}
