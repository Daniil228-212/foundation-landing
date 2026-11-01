"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AGENTS, type AgentId } from "@/content/agents";
import { NEXUSES } from "@/content/nexus";
import { useFoundation, type Panel } from "@/store/foundation";
import { AgentFigure } from "@/components/agents/AgentFigure";
import { DataWindow } from "@/components/panels/DataWindow";
import { GraphWindow } from "@/components/panels/GraphWindow";
import { TeamWindow } from "@/components/panels/TeamWindow";
import { PlasmaSphere } from "./PlasmaSphere";
import { TopBar } from "./TopBar";

const EASE = [0.16, 1, 0.3, 1] as const;
const develop = {
  initial: { opacity: 0, filter: "blur(14px)" },
  animate: { opacity: 1, filter: "blur(0px)", transition: { duration: 1, ease: EASE } },
  exit: { opacity: 0, filter: "blur(10px)", transition: { duration: 0.25, ease: EASE } },
};

/* ---------------- фон по фото 1 ---------------- */
const PRISMS = [
  { l: "12%", t: "18%", rot: "-30deg", dx: "14px", dy: "-20px", d: "0s", s: 1 },
  { l: "83%", t: "21%", rot: "25deg", dx: "-12px", dy: "18px", d: "-4s", s: 0.8 },
  { l: "88%", t: "30%", rot: "-10deg", dx: "10px", dy: "-14px", d: "-8s", s: 1.2 },
  { l: "22%", t: "46%", rot: "70deg", dx: "-16px", dy: "10px", d: "-2s", s: 1.4 },
  { l: "79%", t: "64%", rot: "15deg", dx: "12px", dy: "16px", d: "-6s", s: 0.9 },
  { l: "28%", t: "84%", rot: "-45deg", dx: "18px", dy: "-12px", d: "-10s", s: 1 },
  { l: "62%", t: "90%", rot: "40deg", dx: "-10px", dy: "-18px", d: "-3s", s: 0.7 },
];

function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(42% 30% at 92% 6%, rgba(149,130,132,.85), transparent 70%)",
            "radial-gradient(70% 34% at 50% 104%, rgba(238,238,238,.95), rgba(205,206,211,.5) 45%, transparent 75%)",
            "radial-gradient(60% 45% at 50% 52%, rgba(97,87,96,.55), transparent 70%)",
            "linear-gradient(180deg, #3d3c44 0%, #45434e 38%, #4f4a54 62%, #6d6870 82%, #a69fa7 100%)",
          ].join(","),
        }}
      />
      <div className="grain absolute inset-0" />
      {/* боковые нити */}
      <span className="absolute inset-y-0 left-[3.5%] w-px bg-white/10" />
      <span className="absolute inset-y-0 right-[3.5%] w-px bg-white/10" />
      {PRISMS.map((p, i) => (
        <span
          key={i}
          className="prism"
          style={{ left: p.l, top: p.t, animationDelay: p.d, scale: String(p.s), ["--rot" as string]: p.rot, ["--dx" as string]: p.dx, ["--dy" as string]: p.dy }}
        />
      ))}
    </div>
  );
}

/* ---------------- сфера диалога ---------------- */
function Dashes({ flip = false }: { flip?: boolean }) {
  return (
    <span className={`flex items-center gap-1.5 ${flip ? "flex-row-reverse" : ""}`} aria-hidden>
      <span className="h-[3px] w-5 rounded-full bg-white/80" />
      <span className="h-[3px] w-2.5 rounded-full bg-white/45" />
    </span>
  );
}

function SphereDialog() {
  const messages = useFoundation((s) => s.messages);
  const busy = useFoundation((s) => s.busy);
  const quick = useFoundation((s) => s.quick);
  const step = useFoundation((s) => s.step);
  const send = useFoundation((s) => s.send);
  const setFocused = useFoundation((s) => s.setFocused);
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const mentor = [...messages].reverse().find((m) => m.from === "mentor");
  const lastUser = [...messages].reverse().find((m) => m.from === "user");

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;
    send(value);
    setValue("");
  };
  const pick = (q: string) => {
    if (q.endsWith(" ") || q.endsWith(": ")) {
      setValue(q);
      input.current?.focus();
    } else send(q);
  };

  return (
    <div className="flex flex-col items-center">
      <div data-sphere className="relative aspect-square w-[min(88vw,400px)] rounded-full lg:w-[min(64svh,580px)]">
        {/* матовое стекло внутри кольца */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: "radial-gradient(70% 70% at 38% 30%, rgba(255,255,255,.07), rgba(255,255,255,.015) 60%, rgba(255,255,255,.035))" }}
          aria-hidden
        />
        <div className="absolute inset-x-[13%] inset-y-[15%] flex flex-col items-center justify-center text-center">
          <div className="flex min-h-[42%] w-full flex-col items-center justify-end" aria-live="polite">
            <AnimatePresence mode="wait">
              {busy ? (
                <motion.p key="dots" {...develop} className="serif text-[28px] tracking-[0.3em] text-white/70" aria-label="Ментор думает">
                  ···
                </motion.p>
              ) : (
                mentor && (
                  <motion.div key={mentor.id} {...develop} className="flex items-center gap-3 sm:gap-4">
                    <Dashes />
                    <p className="serif text-[clamp(19px,2.2vw,30px)] leading-[1.18] text-white [text-shadow:0_1px_18px_rgba(255,255,255,.18)]">
                      <span className="sr-only">Ментор: </span>
                      {mentor.text}
                    </p>
                    <Dashes flip />
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>

          {/* волосяная линия с маркером */}
          <div className="relative mt-5 h-px w-full bg-gradient-to-r from-white/10 via-white/45 to-white/10" aria-hidden>
            <svg className="absolute -top-[4px] left-0" width="8" height="6" viewBox="0 0 8 6">
              <path d="M0 0 H8 L4 6 Z" fill="rgba(255,255,255,.75)" />
            </svg>
          </div>

          <div className="mt-3 min-h-[22px]">
            <AnimatePresence mode="wait">
              {lastUser && (
                <motion.p key={lastUser.id} {...develop} className="line-clamp-2 text-[13px] text-white/70">
                  <span className="sr-only">Вы: </span>
                  {lastUser.text}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={submit} className="mt-[6%] flex w-full items-center gap-3">
            <label htmlFor="sphere-input" className="sr-only">
              Ответ Ментору
            </label>
            <span className="glass-btn flex-1 !justify-start !px-5">
              <input
                ref={input}
                id="sphere-input"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                enterKeyHint="send"
                autoComplete={step === "name" ? "given-name" : "off"}
                className="w-full min-w-0 bg-transparent text-[16px] font-normal text-white [text-shadow:none] placeholder:text-white/55 focus:outline-none focus-visible:outline-none"
              />
            </span>
            <button type="submit" aria-label="Отправить" disabled={!value.trim() || busy} className="glass-round">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div className="mt-4 min-h-[44px] lg:mt-6">
        <AnimatePresence mode="wait">
          {quick.length > 0 && !busy && (
            <motion.ul key={quick.join()} {...develop} className="flex max-w-[92vw] flex-wrap justify-center gap-2" aria-label="Быстрые ответы">
              {quick.map((q) => (
                <li key={q}>
                  <button type="button" onClick={() => pick(q)} className="glass-btn !min-h-9 !px-4 !text-[13px]">
                    {q.trim().replace(/:$/, "")}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------- агенты ---------------- */
function Agents() {
  const [open, setOpen] = useState<AgentId | null>(null);
  return (
    <aside aria-label="ИИ-агенты" className="w-full lg:absolute lg:left-[calc(3.5%+28px)] lg:top-1/2 lg:w-auto lg:-translate-y-1/2">
      <ul className="no-scrollbar flex snap-x justify-start gap-1 overflow-x-auto px-[var(--gutter)] lg:flex-col lg:gap-2 lg:overflow-visible lg:px-0">
        {AGENTS.map((a) => {
          const isOpen = open === a.id;
          return (
            <li key={a.id} className="relative shrink-0 snap-start">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : a.id)}
                className="group flex w-[96px] flex-col items-center rounded-2xl py-1 transition-transform duration-150 active:scale-[0.96]"
              >
                <span className="transition-transform duration-200 ease-[var(--ease-out)] group-hover:-translate-y-1">
                  <AgentFigure id={a.id} size={68} sleeping={a.gated} className={a.gated ? "opacity-60" : ""} />
                </span>
                <span className="-mt-0.5 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.1em] text-white/70 lg:tracking-[0.16em]">{a.name}</span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(10px)", transform: "translateX(-6px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)", transform: "translateX(0px)", transition: { duration: 0.4, ease: EASE } }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    className="absolute left-full top-0 z-20 ml-3 hidden w-[290px] rounded-[26px] p-5 lg:block"
                    style={{
                      background: "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04))",
                      boxShadow: "inset 0 1.5px 0 rgba(255,255,255,.8), inset 0 0 0 1px rgba(255,255,255,.25), 0 20px 40px -16px rgba(16,14,20,.6)",
                      backdropFilter: "blur(18px)",
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/70">{a.role}</p>
                    <p className="mt-2 text-[14px] leading-relaxed">{a.does}</p>
                    <ul className="mt-3 space-y-1">
                      {a.firstQuestions.map((q) => (
                        <li key={q} className="serif text-[15px] leading-snug">
                          {q}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[12px] text-white/60">{a.scope.map((s) => NEXUSES.find((n) => n.id === s)!.title).join(" · ")}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

/* ---------------- кнопки проекта ---------------- */
const ACTIONS: { id: Exclude<Panel, null>; title: string }[] = [
  { id: "graph", title: "Граф" },
  { id: "data", title: "Общие данные" },
  { id: "team", title: "Команда" },
];

function ProjectActions() {
  const setPanel = useFoundation((s) => s.setPanel);
  return (
    <nav aria-label="Проект" className="w-full px-[var(--gutter)] lg:absolute lg:right-[calc(3.5%+28px)] lg:top-1/2 lg:w-auto lg:-translate-y-1/2 lg:px-0">
      <ul className="flex flex-wrap justify-center gap-3 lg:flex-col lg:items-stretch lg:gap-4">
        {ACTIONS.map((a) => (
          <li key={a.id}>
            <button type="button" aria-haspopup="dialog" onClick={() => setPanel(a.id)} className="glass-btn w-full lg:min-w-[190px]">
              {a.title}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Hero() {
  const skipIntro = useFoundation((s) => s.skipIntro);

  // заставка с падением радианта собирается последним этапом — пока сразу открываем интерфейс
  useEffect(() => {
    skipIntro();
  }, [skipIntro]);

  return (
    <>
      <TopBar />
      <section
        id="top"
        aria-label="Диалог с Ментором"
        className="relative flex min-h-[100svh] flex-col items-center gap-6 overflow-hidden pb-10 pt-24 lg:block lg:h-[100svh] lg:min-h-[720px] lg:p-0"
      >
        <h1 className="sr-only">Foundation — ИИ-ментор для фаундеров</h1>
        <Backdrop />
        <PlasmaSphere />

        <div className="relative lg:absolute lg:left-1/2 lg:top-[52%] lg:-translate-x-1/2 lg:-translate-y-1/2">
          <SphereDialog />
        </div>
        <div className="relative w-full lg:static">
          <Agents />
        </div>
        <div className="relative w-full lg:static">
          <ProjectActions />
        </div>

        <button type="button" aria-label="Новый проект" title="Новый проект" className="glass-round absolute bottom-6 right-[calc(3.5%+28px)] hidden !size-14 lg:inline-flex">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </section>

      <GraphWindow />
      <DataWindow />
      <TeamWindow />
    </>
  );
}
