"use client";

import { NEXUSES } from "@/content/nexus";
import { nexusFill } from "@/lib/mentorScript";
import { useFoundation } from "@/store/foundation";
import { RadiantMark } from "./RadiantMark";

const CHRONO = NEXUSES.filter((n) => n.id !== "tech").map((n, i) => ({
  id: n.id,
  label: n.id === "ops" ? "operations" : n.id,
  idx: String(i + 1).padStart(2, "0"),
  color: n.color,
}));

/** Хронограф: тонкая линия фаз вместо дашборда */
function Chronograph() {
  const nodes = useFoundation((s) => s.nodes);
  const unlocked = useFoundation((s) => s.unlocked);
  const current = unlocked.includes("product") ? "product" : "market";

  return (
    <nav aria-label="Фаза проекта" className="hidden min-w-0 flex-1 justify-center md:flex">
      <ol className="flex items-center gap-5 text-[11px] tracking-[0.14em] lg:gap-7">
        {CHRONO.map((c, i) => {
          const fill = nexusFill(nodes, c.id);
          const active = c.id === current;
          const locked = !unlocked.includes(c.id);
          return (
            <li key={c.id} className="flex items-center gap-5 lg:gap-7">
              <span
                className={`relative pb-2 transition-opacity duration-700 ${active ? "text-ivory" : locked ? "text-ivory-40" : "text-ivory-60"}`}
                aria-current={active ? "step" : undefined}
              >
                nexus: {c.label} <span style={{ color: active ? "var(--sun)" : undefined }}>•</span> {c.idx}
                <span className="absolute inset-x-0 bottom-0 h-px bg-hair" aria-hidden />
                <span
                  className="absolute bottom-0 left-0 h-px origin-left transition-transform duration-[1600ms] ease-[var(--ease-atelier)]"
                  style={{ width: "100%", transform: `scaleX(${fill})`, background: c.color }}
                  aria-hidden
                />
              </span>
              {i < CHRONO.length - 1 && <span className="h-3 w-px bg-hair-strong" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function MobileChrono() {
  const unlocked = useFoundation((s) => s.unlocked);
  const current = unlocked.includes("product") ? 1 : 0;
  return (
    <p className="whitespace-nowrap text-[11px] tracking-[0.1em] text-ivory-60 md:hidden" aria-label="Фаза проекта">
      nexus: {CHRONO[current].label} <span className="text-sun">•</span> {CHRONO[current].idx}/04
    </p>
  );
}

export function TopBar() {
  const phase = useFoundation((s) => s.phase);
  const soundOn = useFoundation((s) => s.soundOn);
  const toggleSound = useFoundation((s) => s.toggleSound);
  const shown = phase === "greeting" || phase === "ready";

  return (
    <header className="reveal fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-graphite via-graphite/80 to-transparent pt-[env(safe-area-inset-top)]" data-shown={shown}>
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <a href="#top" className="flex shrink-0 items-center gap-3" aria-label="Foundation — наверх">
          <RadiantMark size={26} className="text-ivory" />
          <span className="serif hidden text-[19px] tracking-[0.08em] sm:inline">Foundation</span>
        </a>
        <Chronograph />
        <MobileChrono />
        <div className="flex shrink-0 items-center gap-5">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className="hidden items-center gap-2 text-[11px] tracking-[0.14em] text-ivory-60 transition-colors hover:text-ivory sm:flex"
          >
            <span className="flex h-3 items-end gap-[2px]" aria-hidden>
              {[0.5, 1, 0.7].map((h, i) => (
                <span
                  key={i}
                  className={`w-[2px] rounded-full bg-current ${soundOn ? "eq-bar" : ""}`}
                  style={{ height: soundOn ? `${h * 100}%` : "2px", animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </span>
            звук: {soundOn ? "вкл" : "выкл"}
          </button>
          <a href="#access" className="btn-atelier btn-atelier--sun !min-h-10 !px-5 text-[13px]">
            Ранний доступ
          </a>
        </div>
      </div>
    </header>
  );
}
