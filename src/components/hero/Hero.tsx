"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { AGENTS } from "@/content/agents";
import { NEXUSES } from "@/content/nexus";
import { countTree } from "@/content/projectFiles";
import { nexusFill } from "@/lib/mentorScript";
import { SEEN_KEY, useFoundation, type Panel } from "@/store/foundation";
import { DataWindow, FileGlyph, FolderGlyph, useProjectTree } from "@/components/panels/DataWindow";
import { GraphWindow } from "@/components/panels/GraphWindow";
import { Avatar, founderTasks, TeamWindow } from "@/components/panels/TeamWindow";
import { Gate } from "./Gate";
import { RadiantMark } from "./RadiantMark";
import { TopBar } from "./TopBar";
import { SceneBoundary } from "@/components/three/SceneBoundary";

const Scene = dynamic(() => import("@/components/three/Scene"), { ssr: false });

const EASE = [0.16, 1, 0.3, 1] as const;

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
  const phase = useFoundation((s) => s.phase);
  const messages = useFoundation((s) => s.messages);
  const quick = useFoundation((s) => s.quick);
  const busy = useFoundation((s) => s.busy);
  const send = useFoundation((s) => s.send);
  const setFocused = useFoundation((s) => s.setFocused);
  const step = useFoundation((s) => s.step);
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const ready = phase === "ready";

  const mentor = [...messages].reverse().find((m) => m.from === "mentor");
  const lastUser = [...messages].reverse().find((m) => m.from === "user");
  const placeholder = step === "name" ? "Ваше имя…" : step === "idea" ? "Ваша идея…" : "Ваш ответ…";

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!value.trim()) return;
    send(value);
    setValue("");
  };

  // быстрые ответы: полные — отправляем сразу, заготовки идей — дописываем
  const pick = (q: string) => {
    if (q.endsWith(" ") || q.endsWith(": ")) {
      setValue(q);
      input.current?.focus();
    } else send(q);
  };

  return (
    <div className="flex flex-col items-center">
      <div data-ring className="reveal relative aspect-square w-[min(84vw,360px)] rounded-full lg:w-[min(52svh,480px)]" data-shown={shown}>
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

        <AnimatePresence>
          {phase === "greeting" && (
            <motion.div
              key="hello"
              className="absolute inset-0 flex flex-col items-center justify-center text-center"
              initial={{ opacity: 0, filter: "blur(20px)" }}
              animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 1.4, delay: 0.5, ease: EASE } }}
              exit={{ opacity: 0, filter: "blur(16px)", transition: { duration: 0.6, ease: EASE } }}
            >
              <p className="serif text-[clamp(44px,6vw,80px)] leading-none">Привет</p>
              <p className="mt-3 max-w-[22ch] text-[14px] text-ivory-60">Я Ментор. Я не соглашаюсь — я проверяю.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="reveal absolute inset-[13%] flex flex-col items-center justify-center text-center" data-shown={ready}>
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
                  <motion.p key={"m" + mentor.id} {...develop} className="serif text-[clamp(18px,2.1vw,25px)] italic leading-[1.22] text-ivory">
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
              autoComplete={step === "name" ? "given-name" : "off"}
              placeholder={placeholder}
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

      <div className="mt-6 min-h-[52px]">
        <AnimatePresence mode="wait">
          {ready && quick.length > 0 && (
            <motion.ul key={quick.join()} {...develop} className="flex max-w-[92vw] flex-wrap justify-center gap-x-5 gap-y-2" aria-label="Быстрые ответы">
              {quick.map((q) => (
                <li key={q}>
                  <button type="button" onClick={() => pick(q)} className="link-quiet text-[13px] text-ivory-60">
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

/* ---------------- инструменты (слева) ---------------- */
function ToolsRail({ shown }: { shown: boolean }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <aside aria-label="Инструменты" className="reveal w-full lg:absolute lg:left-[var(--gutter)] lg:top-1/2 lg:w-[250px] lg:-translate-y-1/2" data-shown={shown}>
      <p className="caps mb-5 px-[var(--gutter)] lg:px-0">Инструменты</p>
      <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-[var(--gutter)] lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0">
        {AGENTS.map((a) => {
          const isOpen = open === a.id;
          return (
            <li key={a.id} className="relative shrink-0 snap-start">
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : a.id)}
                className={`group rounded-2xl border border-hair px-4 py-3 text-left transition-[border-color,transform] duration-150 active:scale-[0.98] lg:w-full lg:border-0 lg:p-0 ${a.gated ? "opacity-45" : ""}`}
              >
                <span className="flex items-center gap-2 text-[11px] tracking-[0.18em] text-ivory-60 uppercase">
                  <span className="size-1.5 rounded-full" style={{ background: a.color }} aria-hidden />
                  агент · {a.name}
                  {a.gated && <span className="normal-case tracking-normal text-ivory-40">· после гейта</span>}
                </span>
                <span className="serif mt-1.5 block whitespace-nowrap text-[19px] leading-tight transition-colors group-hover:text-sun lg:whitespace-normal lg:text-[21px]">
                  {a.tools.map((t) => t.title).join(" · ")}
                </span>
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, filter: "blur(10px)", transform: "translateX(-6px)" }}
                    animate={{ opacity: 1, filter: "blur(0px)", transform: "translateX(0px)", transition: { duration: 0.5, ease: EASE } }}
                    exit={{ opacity: 0, filter: "blur(6px)", transition: { duration: 0.18 } }}
                    className="absolute left-full top-0 z-20 ml-6 hidden w-[310px] rounded-2xl border border-hair bg-graphite-2/95 p-5 backdrop-blur-xl lg:block"
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
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 hidden max-w-[240px] text-[12px] leading-relaxed text-ivory-40 lg:block">
        Свой ключ Claude или GPT — или инструменты по подписке.
      </p>
    </aside>
  );
}

/* ---------------- мини-превью справа ---------------- */
function GraphMini() {
  const nodes = useFoundation((s) => s.nodes);
  const unlocked = useFoundation((s) => s.unlocked);
  const pos: Record<string, [number, number]> = { market: [34, 38], product: [92, 22], growth: [150, 46], ops: [70, 76], tech: [178, 16] };
  return (
    <svg viewBox="0 0 210 96" className="h-[84px] w-full" aria-hidden>
      {[
        ["market", "product"],
        ["product", "growth"],
        ["growth", "ops"],
        ["ops", "market"],
        ["product", "tech"],
      ].map(([a, b]) => (
        <line key={a + b} x1={pos[a][0]} y1={pos[a][1]} x2={pos[b][0]} y2={pos[b][1]} stroke="rgba(236,232,225,.16)" strokeDasharray="2 3" />
      ))}
      {NEXUSES.map((n) => {
        const [x, y] = pos[n.id];
        const fill = nexusFill(nodes, n.id);
        const locked = !unlocked.includes(n.id);
        const count = nodes.filter((f) => f.nexus === n.id).length;
        return (
          <g key={n.id} opacity={locked ? 0.35 : 1}>
            {Array.from({ length: Math.min(count, 6) }).map((_, i) => {
              const a = i * 1.9 + x;
              return <circle key={i} cx={x + Math.cos(a) * 15} cy={y + Math.sin(a) * 12} r={1.8} fill={n.color} />;
            })}
            <circle cx={x} cy={y} r={7 + fill * 5} fill={n.color} opacity={0.18 + fill * 0.3} style={{ transition: "all 1.6s cubic-bezier(.16,1,.3,1)" }} />
            <circle cx={x} cy={y} r={3.5} fill={n.color} />
          </g>
        );
      })}
    </svg>
  );
}

function DataMini() {
  const tree = useProjectTree();
  const c = countTree(tree);
  const fresh = useMemo(() => {
    const out: string[] = [];
    const walk = (n: typeof tree) => n.children?.forEach((ch) => (ch.kind === "file" ? ch.fresh && out.push(ch.name) : walk(ch)));
    walk(tree);
    return out[out.length - 1];
  }, [tree]);
  return (
    <div className="space-y-1.5 text-[12px]">
      {tree.children!.slice(1, 4).map((f) => (
        <p key={f.name} className="flex items-center gap-2 text-ivory-60">
          <FolderGlyph />
          <span className="flex-1 truncate">{f.name}</span>
          <span className="text-ivory-40">{countTree(f).files}</span>
        </p>
      ))}
      <p className="flex items-center gap-2 truncate pt-1 text-sun">
        <FileGlyph />
        <span className="truncate">{fresh ?? `${c.files} файлов · ${c.folders - 1} папок`}</span>
      </p>
    </div>
  );
}

function TeamMini() {
  const profile = useFoundation((s) => s.profile);
  const step = useFoundation((s) => s.step);
  const nodes = useFoundation((s) => s.nodes);
  const unlocked = useFoundation((s) => s.unlocked);
  const doing = founderTasks(step, nodes, unlocked).find((t) => t.status === "doing");
  return (
    <div>
      <div className="flex items-center">
        <Avatar name={profile.name} size={30} />
        {[0, 1, 2].map((i) => (
          <span key={i} className="-ml-2 size-[30px] rounded-full border border-dashed border-hair-strong bg-graphite" aria-hidden />
        ))}
        <span className="ml-3 text-[12px] text-ivory-60">{profile.name ?? "Вы"} + 3 роли</span>
      </div>
      {doing && <p className="mt-2.5 truncate text-[12px] text-ivory-60">в работе: {doing.title.toLowerCase()}</p>}
    </div>
  );
}

const ACTIONS: { id: Exclude<Panel, null>; title: string; hint: string; Mini: () => React.JSX.Element }[] = [
  { id: "graph", title: "Граф", hint: "база знаний проекта", Mini: GraphMini },
  { id: "data", title: "Общие данные", hint: "файлы и папки", Mini: DataMini },
  { id: "team", title: "Команда", hint: "кто что делает", Mini: TeamMini },
];

function ProjectRail({ shown }: { shown: boolean }) {
  const setPanel = useFoundation((s) => s.setPanel);
  const count = useFoundation((s) => s.nodes.length);
  return (
    <aside aria-label="Проект" className="reveal w-full px-[var(--gutter)] lg:absolute lg:right-[var(--gutter)] lg:top-1/2 lg:w-[270px] lg:-translate-y-1/2 lg:px-0" data-shown={shown}>
      <p className="caps mb-5">Проект</p>
      <ul className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-3">
        {ACTIONS.map(({ id, title, hint, Mini }, i) => (
          <li key={id}>
            <button
              type="button"
              onClick={() => setPanel(id)}
              aria-haspopup="dialog"
              className="group relative w-full overflow-hidden rounded-[20px] border border-hair bg-graphite-2/70 p-3 text-left backdrop-blur-md transition-[border-color,transform] duration-150 hover:border-hair-strong active:scale-[0.98] lg:p-4"
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="serif text-[18px] leading-none transition-colors group-hover:text-sun lg:text-[22px]">
                  {title}
                  {id === "graph" && <span className="ml-1.5 align-top font-sans text-[11px] text-ivory-60">{count}</span>}
                </span>
                <span className="hidden text-[11px] italic text-ivory-40 lg:inline">{["i", "ii", "iii"][i]}.</span>
              </span>
              <span className="mt-1 hidden text-[11px] text-ivory-40 lg:block">{hint}</span>
              <span className="mt-3 hidden lg:block">
                <Mini />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
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

  // заставка — только при первом визите
  useEffect(() => {
    try {
      if (localStorage.getItem(SEEN_KEY) && useFoundation.getState().phase === "gate") skipIntro();
    } catch {
      /* нет доступа к storage — покажем заставку */
    }
  }, [skipIntro]);

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
      <section
        ref={section}
        id="top"
        aria-label="Демо-сессия с Ментором"
        className="relative flex min-h-[100svh] flex-col items-center gap-8 overflow-hidden pb-10 pt-[calc(64px+min(30vw,150px))] lg:block lg:h-[100svh] lg:min-h-[680px] lg:p-0"
      >
        {webgl && (
          <SceneBoundary fallback={<RadiantMark size={96} className="absolute left-1/2 top-[90px] -translate-x-1/2 text-ivory lg:top-[12%]" />}>
            <div className="absolute inset-0">
              <Scene active={inView} />
            </div>
          </SceneBoundary>
        )}

        {webgl === false && <RadiantMark size={96} className="absolute left-1/2 top-[90px] -translate-x-1/2 text-ivory lg:top-[12%]" />}

        <div className="relative lg:absolute lg:left-1/2 lg:top-[58%] lg:-translate-x-1/2 lg:-translate-y-1/2">
          <Ring shown={shown} />
        </div>
        <div className="relative w-full lg:static">
          <ToolsRail shown={shown} />
        </div>
        <div className="relative w-full lg:static">
          <ProjectRail shown={shown} />
        </div>

        {(phase === "intro" || phase === "greeting") && !reduce && (
          <button type="button" onClick={skipIntro} className="link-quiet absolute bottom-6 left-1/2 z-20 -translate-x-1/2 text-[12px] text-ivory-60">
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

      <GraphWindow />
      <DataWindow />
      <TeamWindow />
    </>
  );
}
