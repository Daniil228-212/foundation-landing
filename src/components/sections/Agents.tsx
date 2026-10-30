import { AGENTS } from "@/content/agents";
import { NEXUSES } from "@/content/nexus";
import { MiniAgent } from "@/components/mascot/MiniAgent";
import { Icon } from "@/components/ui/Icon";

const STYLES = [
  { name: "Минимализм", bg: "linear-gradient(135deg,#f4f4f2,#dcdcd6)", ink: "#111" },
  { name: "Максимализм", bg: "linear-gradient(135deg,#ff5fd2,#ffc93c 55%,#4df3ff)", ink: "#111" },
  { name: "Монохром", bg: "linear-gradient(135deg,#1a1a1a,#4a4a4a)", ink: "#fff" },
  { name: "Цвет", bg: "linear-gradient(135deg,#9b8cff,#4df3ff)", ink: "#0b0b2a" },
];

export function Agents() {
  return (
    <section id="agents" aria-labelledby="agents-title" className="py-20 lg:py-28">
      <div className="container-x">
        <header className="mb-10 max-w-[60ch]">
          <p className="eyebrow mb-3">Агенты</p>
          <h2 id="agents-title" className="font-display text-[clamp(26px,3.6vw,44px)] font-semibold leading-tight tracking-tight">
            Команда, которая знает ваш контекст
          </h2>
          <p className="mt-4 text-ink-2">
            Каждый агент работает только со своей частью графа и начинает с вопросов. Разработчик ждёт, пока гипотезы подтвердятся.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((a) => (
            <li key={a.id}>
              <article
                className={`glass relative flex h-full flex-col rounded-[var(--radius)] p-5 ${a.gated ? "opacity-70" : ""}`}
                style={{ boxShadow: `inset 0 1px 0 0 ${a.color}33` }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <MiniAgent id={a.id} color={a.color} size={56} dim={a.gated} />
                  <div>
                    <h3 className="flex items-center gap-1.5 font-medium">
                      {a.name}
                      {a.gated && <Icon name="lock" size={14} className="text-ink-3" />}
                    </h3>
                    <p className="text-xs text-ink-3">{a.role}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-ink-2">{a.does}</p>
                <p className="mt-3 text-xs italic leading-relaxed text-ink-3">{a.character}</p>

                <div className="mt-4">
                  <p className="mb-2 text-xs text-ink-3">Спросит в начале</p>
                  <ul className="space-y-1.5 text-sm">
                    {a.firstQuestions.map((q) => (
                      <li key={q} className="rounded-xl bg-white/[0.04] px-3 py-2">
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>

                {a.id === "designer" && (
                  <ul className="mt-3 grid grid-cols-4 gap-2" aria-label="Мини-галерея стилей">
                    {STYLES.map((s) => (
                      <li key={s.name}>
                        <div className="grid aspect-square place-items-center rounded-lg text-[9px] font-semibold" style={{ background: s.bg, color: s.ink }}>
                          Aa
                        </div>
                        <span className="mt-1 block text-center text-[10px] text-ink-3">{s.name}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                  {a.scope.map((s) => {
                    const nx = NEXUSES.find((n) => n.id === s)!;
                    return (
                      <span key={s} className="rounded-full border px-2.5 py-1 text-[11px]" style={{ borderColor: `color-mix(in oklab, ${nx.color} 45%, transparent)`, color: nx.color }}>
                        {nx.title}
                      </span>
                    );
                  })}
                </div>
                {a.gated && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-3">
                    <Icon name="lock" size={12} /> Откроется после этапов «Рынок» и «Продукт»
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
