"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { EXPERTS, type Expert } from "@/content/experts";
import { NEXUSES } from "@/content/nexus";
import { useFoundation } from "@/store/foundation";

const EASE = [0.16, 1, 0.3, 1] as const;
const SLOTS = ["Пн · 18:00", "Ср · 12:30", "Пт · 10:00"];

/** Нейтральный портрет-плейсхолдер: силуэт на пигментном фоне (пока нет фото с согласия) */
function Portrait({ e }: { e: Expert }) {
  if (e.photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={e.photo} alt={e.name ?? e.role} className="h-full w-full object-cover" />;
  }
  return (
    <svg viewBox="0 0 300 380" className="h-full w-full" role="img" aria-label={`Место для фото: ${e.role}`}>
      <defs>
        <radialGradient id={`pg-${e.id}`} cx="50%" cy="30%" r="80%">
          <stop offset="0" stopColor={e.hue} stopOpacity="0.55" />
          <stop offset="0.65" stopColor="#1e1d1b" />
          <stop offset="1" stopColor="#141413" />
        </radialGradient>
        <linearGradient id={`ps-${e.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ece8e1" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ece8e1" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect width="300" height="380" fill={`url(#pg-${e.id})`} />
      <circle cx="150" cy="150" r="56" fill={`url(#ps-${e.id})`} />
      <path d="M40 380 C 48 268, 100 232, 150 232 C 200 232, 252 268, 260 380 Z" fill={`url(#ps-${e.id})`} />
    </svg>
  );
}

function Card({ e, recommended }: { e: Expert; recommended: boolean }) {
  const [booking, setBooking] = useState(false);
  const [slot, setSlot] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <article className="group relative flex h-full w-[min(78vw,290px)] shrink-0 snap-start flex-col">
      <div className="relative aspect-[3/4] overflow-hidden rounded-[22px] border border-hair">
        <div className="h-full w-full transition-transform duration-[1200ms] ease-[var(--ease-atelier)] group-hover:scale-[1.03]">
          <Portrait e={e} />
        </div>
        {recommended && (
          <span className="absolute left-3 top-3 rounded-full bg-sun px-3 py-1 text-[11px] font-medium text-sun-ink">Ментор рекомендует</span>
        )}

        <AnimatePresence>
          {booking && (
            <motion.div
              className="absolute inset-0 flex flex-col justify-end bg-graphite/80 p-4 backdrop-blur-md"
              initial={{ opacity: 0, filter: "blur(12px)" }}
              animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
            >
              {sent ? (
                <p className="text-[13px] leading-relaxed" role="status">
                  Заявка на <span className="text-sun">{slot}</span> принята в демо-режиме. В ранней версии эксперт подтвердит время, а Ментор
                  подготовит вопросы по вашему графу.
                </p>
              ) : (
                <>
                  <p className="caps mb-3">Интервью · 30 минут</p>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Время интервью">
                    {SLOTS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={slot === s}
                        onClick={() => setSlot(s)}
                        className={`rounded-full border px-3 py-1.5 text-[12px] transition-colors duration-150 active:scale-[0.97] ${
                          slot === s ? "border-sun bg-sun/10 text-sun" : "border-hair-strong text-ivory-60"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={!slot}
                    onClick={() => setSent(true)}
                    className="btn-atelier btn-atelier--sun mt-4 !min-h-10 w-full text-[13px] disabled:opacity-40"
                  >
                    Записаться
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="caps">{e.sphere}</p>
        <h3 className="serif mt-2 text-[22px] leading-[1.1]">{e.name ?? e.role}</h3>
        {e.name && <p className="mt-1 text-[13px] text-ivory-60">{e.role}{e.company ? ` · ${e.company}` : ""}</p>}
        <p className="mt-2 text-[13px] leading-relaxed text-ivory-60">{e.expertise}</p>
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ivory-40">
          {e.nexus.map((id) => {
            const n = NEXUSES.find((x) => x.id === id)!;
            return (
              <span key={id} className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full" style={{ background: n.color }} />
                {n.title}
              </span>
            );
          })}
        </p>
        <button
          type="button"
          aria-expanded={booking}
          onClick={() => {
            setBooking((b) => !b);
            setSent(false);
          }}
          className="link-quiet mt-4 self-start text-[13px]"
        >
          {booking ? "Закрыть" : "Записаться на интервью"}
        </button>
      </div>
    </article>
  );
}

export function Experts() {
  const track = useRef<HTMLUListElement>(null);
  const ideaType = useFoundation((s) => s.ideaType);
  const hasIdea = useFoundation((s) => s.nodes.some((n) => n.kind === "idea"));
  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * 310, behavior: "smooth" });

  // рекомендованные — первыми
  const list = hasIdea ? [...EXPERTS].sort((a, b) => Number(b.fits.includes(ideaType)) - Number(a.fits.includes(ideaType))) : EXPERTS;

  return (
    <section id="experts" aria-labelledby="experts-title" className="relative border-t border-hair py-24 lg:py-36">
      <div className="container-x">
        <header className="mb-12 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[640px]">
            <p className="caps mb-5">Эксперты</p>
            <h2 id="experts-title" className="serif text-[clamp(40px,5.4vw,76px)] leading-[0.98]">
              Когда знаний не хватает — <em>интервью с экспертом</em>
            </h2>
            <p className="mt-6 max-w-[48ch] text-[15px] leading-relaxed text-ivory-60">
              Ментор сам видит, где в графе пробел, и подсказывает, к кому идти. Вопросы к встрече он подготовит заранее.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => scroll(-1)} aria-label="Назад" className="grid size-12 place-items-center rounded-full border border-hair-strong transition-transform duration-150 active:scale-95">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" onClick={() => scroll(1)} aria-label="Вперёд" className="grid size-12 place-items-center rounded-full border border-hair-strong transition-transform duration-150 active:scale-95">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </header>
      </div>

      <ul
        ref={track}
        className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-[var(--gutter)] pb-4 [scroll-padding-inline:var(--gutter)] lg:gap-7"
        aria-label="Эксперты для интервью"
      >
        {list.map((e) => (
          <li key={e.id} className="flex">
            <Card e={e} recommended={hasIdea && e.fits.includes(ideaType)} />
          </li>
        ))}
      </ul>

      <p className="container-x mt-8 text-[12px] text-ivory-40">
        Примеры профилей. Пул экспертов формируется — имена и фото появятся после согласия каждого эксперта.
      </p>
    </section>
  );
}
