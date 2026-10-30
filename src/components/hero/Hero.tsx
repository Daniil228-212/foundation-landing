"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AGENTS, WORKSPACE_ACTIONS } from "@/content/agents";
import { NEXUSES } from "@/content/nexus";
import { Mascot } from "@/components/mascot/Mascot";
import { useFoundation } from "@/store/foundation";
import { Gate } from "./Gate";
import { TopBar } from "./TopBar";

const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

const EASE = [0.16, 1, 0.3, 1] as const;
const QUICK = ["соцсеть для…", "SaaS для бизнеса", "маркетплейс", "мобильное приложение"];

/** «Проявление»: blur 20 → 0, медленная кривая Atelier */
const develop = {
  initial: { opacity: 0, filter: "blur(20px)" },
  animate: { opacity: 1, filter: "blur(0px)", transition: { duration: 1.4, ease: EASE } },
  exit: { opacity: 0, filter: "blur(12px)", transition: { duration: 0.35, ease: EASE } },
};

function useWebGL() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setOk(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

/* ---------------- кольцо ввода ---------------- */
function Ring({ shown }: { shown: boolean }) {
  const messages = useFoundation((s) => s.messages);
  const busy = useFoundation((s) => s.busy);
  const ready = useFoundation((s) => s.phase === "ready");
  const send = useFoundation((s) => s.send);
  const setFocused = useFoundation((s) => s.setFocused);
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const mentor = [...messages].reverse().find((m) => m.from === "mentor");
  const lastUser = messages.at(-1)?.from === "user" ? messages.at(-1) : [...messages].reverse().find((m) => m.from === "user");

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;
    send(value);
    setValue("");
  };

  return (
    <div className="flex flex-col items-center">
      <div data-ring className="reveal relative aspect-square w-[min(80vw,340px)] rounded-full lg:w-[min(52svh,480px)]" data-shown={shown}>
        <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle className="ring-line" cx="50" cy="50" r="49.6" fill="none" stroke="rgba(236,232,225,.38)" strokeWidth="0.25" pathLength={1} />
          <g className="ring-glint">
            <circle cx="50" cy="50" r="49.6" fill="none" stroke="url(#glint)" strokeWidth="0.5" strokeDasharray="22 290" />
          </g>
          <defs>
            <linearGradient id="glint">
              <stop offset="0" stopColor="#ffd54f" stopOpacity="0" />
              <stop offset="1" stopColor="#ffd54f" stopOpacity="0.9" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute inset-[13%] flex flex-col items-center justify-center text-center">
          <div className="flex min-h-[52%] w-full flex-col items-center justify-end gap-3" aria-live="polite">
            <AnimatePresence mode="wait">
              {lastUser && (
                <motion.p key={"u" + lastUser.id} {...develop} className="line-clamp-2 max-w-[92%] text-[13px] leading-snug text-ivory-60">
                  <span className="sr-only">Вы: </span>
                  {lastUser.text}
                </motion.p>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {busy ? (
                <motion.p key="dots" {...develop} className="serif text-2xl tracking-[0.3em] text-ivory-60" aria-label="Ментор думает">
                  ···
                </motion.p>
              ) : (
                mentor && (
                  <motion.p
                    key={"m" + mentor.id}
                    {...develop}
                    className="serif text-[clamp(18px,2.1vw,25px)] italic leading-[1.22] text-ivory"
                  >
                    <span className="sr-only">Ментор: </span>
                    {mentor.text}
                  </motion.p>
                )
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={submit} className="mt-[7%] flex w-[86%] items-center gap-2 border-b border-hair-strong pb-1.5 focus-within:border-ivory-60">
            <label htmlFor="ring-input" className="sr-only">
              Ответ Ментору
            </label>
            <input
              ref={input}
              id="ring-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              disabled={!ready}
              enterKeyHint="send"
              autoComplete="off"
              placeholder="Ваша идея…"
              className="min-w-0 flex-1 bg-transparent py-1 text-center text-[16px] font-light text-ivory placeholder:text-ivory-40 focus:outline-none focus-visible:outline-none"
            />
            <button
              type="submit"
              aria-label="Отправить"
              disabled={!ready || !value.trim()}
              className="grid size-8 shrink-0 place-items-center rounded-full border border-hair-strong text-ivory transition-[transform,opacity] duration-150 active:scale-95 disabled:opacity-30"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <ul className="reveal mt-6 flex max-w-[92vw] flex-wrap justify-center gap-x-5 gap-y-2" data-shown={shown} aria-label="Примеры идей">
        {QUICK.map((q) => (
          <li key={q}>
            <button
              type="button"
              disabled={!ready}
              onClick={() => {
                setValue(q === "соцсеть для…" ? "Соцсеть для " : q[0].toUpperCase() + q.slice(1) + " для ");
                input.current?.focus();
              }}
              className="link-quiet text-[13px] text-ivory-60 disabled:opacity-40"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- агенты (слева / лента на мобильном) ---------------- */
function AgentsRail({ shown }: { shown: boolean }) {
  const hovered = useFoundation((s) => s.hoveredAgent);
  const setHovered = useFoundation((s) => s.setHoveredAgent);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <aside
      aria-label="ИИ-агенты"
      className="reveal pointer-events-auto lg:absolute lg:left-[var(--gutter)] lg:top-1/2 lg:-translate-y-1/2"
      data-shown={shown}
    >
      <p className="caps mb-5 hidden lg:block">Агенты</p>
      <ul className="no-scrollbar -mx-[var(--gutter)] flex snap-x gap-3 overflow-x-auto px-[var(--gutter)] lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
        {AGENTS.map((a) => {
          const isOpen = open === a.id;
          return (
            <li key={a.id} className="relative snap-start">
              <button
                type="button"
                aria-expanded={isOpen}
                onMouseEnter={() => setHovered(a.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(a.id)}
                onBlur={() => setHovered(null)}
                onClick={() => setOpen(isOpen ? null : a.id)}
                className={`group flex w-[104px] flex-col items-center gap-2 rounded-2xl py-2 text-center transition-[opacity,transform] duration-150 active:scale-[0.97] lg:w-auto lg:flex-row lg:gap-4 lg:pr-4 lg:text-left ${
                  hovered && hovered !== a.id ? "opacity-45" : ""
                }`}
              >
                <span data-agent-slot={a.id} className="block size-14 shrink-0 lg:size-16" aria-hidden />
                <span>
                  <span className="serif flex items-center justify-center gap-1.5 text-[17px] leading-none lg:justify-start lg:text-[21px]">
                    {a.name}
                    {a.gated && <LockGlyph />}
                  </span>
                  <span className="mt-1.5 hidden text-[12px] text-ivory-60 lg:block">{a.tools.map((t) => t.title).join(" · ")}</span>
                </span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(10px)", transform: "translateX(-6px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)", transform: "translateX(0px)", transition: { duration: 0.5, ease: EASE } }}
                    exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.18 } }}
                    className="absolute left-full top-0 z-20 ml-3 hidden w-[300px] rounded-2xl border border-hair bg-graphite-2/95 p-5 backdrop-blur-xl lg:block"
                  >
                    <p className="caps mb-2" style={{ color: a.color }}>
                      {a.role}
                    </p>
                    <p className="text-[14px] leading-relaxed text-ivory">{a.does}</p>
                    <p className="caps mb-2 mt-4">Спросит в начале</p>
                    <ul className="space-y-1.5">
                      {a.firstQuestions.map((q) => (
                        <li key={q} className="serif text-[17px] italic leading-snug">
                          — {q}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-4 text-[12px] text-ivory-60">
                      Видит только: {a.scope.map((s) => NEXUSES.find((n) => n.id === s)!.title).join(", ")}
                    </p>
                    {a.gated && <p className="mt-2 text-[12px] text-ivory-60">Проснётся после подтверждения Рынка и Продукта.</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 hidden max-w-[230px] text-[12px] leading-relaxed text-ivory-40 lg:block">
        Свой ключ Claude или GPT — или инструменты по подписке.
      </p>
    </aside>
  );
}

function LockGlyph() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ivory-40" aria-label="заблокирован">
      <path d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z" />
    </svg>
  );
}

/* ---------------- проект (справа) ---------------- */
function ProjectRail({ shown }: { shown: boolean }) {
  const count = useFoundation((s) => s.nodes.length);
  const roman = ["i", "ii", "iii"];
  return (
    <aside
      aria-label="Проект"
      className="reveal absolute right-[var(--gutter)] top-1/2 hidden -translate-y-1/2 lg:block"
      data-shown={shown}
    >
      <p className="caps mb-5">Проект</p>
      <ul className="space-y-5">
        {WORKSPACE_ACTIONS.map((a, i) => (
          <li key={a.id}>
            <a href={a.id === "graph" ? "#cortex" : "#cortex"} className="group flex items-baseline gap-4">
              <span className="serif w-6 text-[15px] italic text-ivory-40">{roman[i]}.</span>
              <span>
                <span className="serif block text-[21px] leading-none transition-colors group-hover:text-sun">
                  {a.title}
                  {a.id === "graph" && <span className="ml-2 align-top text-[11px] not-italic text-ivory-60">{count}</span>}
                </span>
                <span className="mt-1.5 block text-[12px] text-ivory-60">{a.hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ---------------- приветствие ---------------- */
function Greeting() {
  const phase = useFoundation((s) => s.phase);
  return (
    <AnimatePresence>
      {phase === "greeting" && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 top-[16%] z-10 text-center"
          initial={{ opacity: 0, filter: "blur(20px)" }}
          animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 1.6, delay: 1.1, ease: EASE } }}
          exit={{ opacity: 0, filter: "blur(20px)", transition: { duration: 0.8, ease: EASE } }}
        >
          <p className="serif text-[clamp(44px,7vw,96px)] leading-none">Привет!</p>
          <p className="mt-4 text-[15px] text-ivory-60">Я Ментор. Я не соглашаюсь — я проверяю.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Hero() {
  const phase = useFoundation((s) => s.phase);
  const skipIntro = useFoundation((s) => s.skipIntro);
  const webgl = useWebGL();
  const reduce = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(true);
  const shown = phase === "greeting" || phase === "ready";

  // пауза рендера, когда герой вне вьюпорта
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // без WebGL — без заставки
  useEffect(() => {
    if (webgl === false && phase === "intro") skipIntro();
  }, [webgl, phase, skipIntro]);

  return (
    <>
      <Gate />
      <TopBar />
      <section ref={section} id="top" aria-label="Демо-сессия с Ментором" className="relative h-[100svh] min-h-[640px] overflow-hidden">
        <div className="absolute inset-0">{webgl && <Scene active={inView} />}</div>

        {webgl === false && (
          <Mascot className="absolute left-1/2 top-[14%] w-[min(46vw,240px)] -translate-x-1/2" />
        )}

        <Greeting />

        <div className="pointer-events-none absolute inset-0">
          <div className="pointer-events-auto absolute left-1/2 top-[54%] -translate-x-1/2 -translate-y-1/2 lg:top-[57%]">
            <Ring shown={shown} />
          </div>
          <div className="absolute inset-x-0 bottom-[max(16px,env(safe-area-inset-bottom))] lg:top-0 lg:bottom-0">
            <AgentsRail shown={shown} />
          </div>
          <div className="pointer-events-auto">
            <ProjectRail shown={shown} />
          </div>
        </div>

        {(phase === "intro" || phase === "greeting") && !reduce && (
          <button type="button" onClick={skipIntro} className="link-quiet absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-[12px] text-ivory-60 max-lg:hidden">
            Пропустить
          </button>
        )}

        <button
          type="button"
          aria-label="Новый проект"
          className="reveal group absolute bottom-6 right-[var(--gutter)] hidden size-14 place-items-center rounded-full border border-hair-strong text-ivory transition-[transform,border-color] duration-150 hover:border-sun active:scale-95 lg:grid"
          data-shown={phase === "ready"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden className="transition-transform duration-500 group-hover:rotate-90">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span className="pointer-events-none absolute right-full mr-4 whitespace-nowrap text-[12px] text-ivory-60 opacity-0 transition-opacity group-hover:opacity-100">
            Новый проект
          </span>
        </button>
      </section>
    </>
  );
}
