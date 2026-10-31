"use client";

import { useState } from "react";
import { NEXUSES, type NexusId } from "@/content/nexus";
import type { CortexNode, Step } from "@/lib/mentorScript";
import { isOnboarding } from "@/lib/mentorScript";
import { useFoundation } from "@/store/foundation";
import { Window } from "./Window";

export type Task = { title: string; status: "done" | "doing" | "todo" | "locked"; nexus: NexusId };

/** Задачи фаундера выводятся из состояния диалога — не придуманы, а следуют методу */
export function founderTasks(step: Step, nodes: CortexNode[], unlocked: NexusId[]): Task[] {
  const has = (k: CortexNode["kind"]) => nodes.some((n) => n.kind === k && n.nexus !== "ops");
  const onboarding = isOnboarding(step);
  const product = unlocked.includes("product");
  return [
    { title: "Познакомиться с Ментором", status: onboarding ? "doing" : "done", nexus: "ops" },
    { title: "Описать, кто платит и сколько их", status: has("audience") ? "done" : onboarding ? "todo" : "doing", nexus: "market" },
    { title: "Найти альтернативы и барьеры", status: has("alternative") ? "done" : has("audience") ? "doing" : "todo", nexus: "market" },
    { title: "Посчитать CAC и LTV", status: has("metric") ? "done" : has("alternative") ? "doing" : "todo", nexus: "growth" },
    { title: "Провести 5 проблемных интервью", status: product ? "doing" : "todo", nexus: "market" },
    { title: "Сформулировать первую функцию", status: has("feature") ? "done" : product ? "doing" : "locked", nexus: "product" },
  ];
}

const STATUS: Record<Task["status"], { label: string; color: string }> = {
  done: { label: "готово", color: "var(--st-ok)" },
  doing: { label: "в работе", color: "var(--st-check)" },
  todo: { label: "ждёт", color: "var(--ivory-40)" },
  locked: { label: "после гейта", color: "var(--ivory-40)" },
};

const SLOTS: { role: string; sees: NexusId[]; gated?: boolean }[] = [
  { role: "Сооснователь", sees: ["market", "product", "growth", "ops"] },
  { role: "Дизайнер", sees: ["product"] },
  { role: "Маркетолог", sees: ["market", "growth"] },
  { role: "Разработчик", sees: ["tech", "product"], gated: true },
];

export function Avatar({ name, size = 44 }: { name?: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-serif text-sun-ink"
      style={{ width: size, height: size, fontSize: size * 0.45, background: "radial-gradient(circle at 35% 30%, #ffe8a0, #ffd54f 55%, #e0a91c)" }}
      aria-hidden
    >
      {(name ?? "Вы").slice(0, 1).toUpperCase()}
    </span>
  );
}

export function TeamWindow() {
  const profile = useFoundation((s) => s.profile);
  const step = useFoundation((s) => s.step);
  const nodes = useFoundation((s) => s.nodes);
  const unlocked = useFoundation((s) => s.unlocked);
  const [note, setNote] = useState<string | null>(null);
  const tasks = founderTasks(step, nodes, unlocked);
  const level = { novice: "новичок", practitioner: "практик", expert: "эксперт" }[profile.level ?? "novice"];
  const nx = (id: NexusId) => NEXUSES.find((n) => n.id === id)!;

  return (
    <Window
      id="team"
      eyebrow="Команда"
      title="Кто что делает"
      aside={
        <div className="space-y-6">
          <div>
            <p className="caps mb-3">Лента</p>
            <ul className="space-y-3 text-[13px] leading-snug">
              {nodes.length === 0 && <li className="text-ivory-40">Пока тихо. Ответьте Ментору — здесь появятся события.</li>}
              {[...nodes].reverse().slice(0, 8).map((n) => (
                <li key={n.id} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: nx(n.nexus).color }} />
                  <span>
                    <span className="text-ivory-60">Ментор записал в {nx(n.nexus).title}: </span>
                    {n.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-[12px] leading-relaxed text-ivory-40">Каждый участник видит только свои Нексусы — так контекст не смешивается.</p>
        </div>
      }
    >
      <div className="absolute inset-0 overflow-y-auto p-4 [overscroll-behavior:contain] sm:p-6">
        <article className="rounded-[22px] border border-hair-strong p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <Avatar name={profile.name} size={52} />
            <div className="min-w-0">
              <p className="serif text-[26px] leading-none">{profile.name ?? "Вы"}</p>
              <p className="mt-1.5 text-[12px] text-ivory-60">
                Фаундер · {profile.level ? level : "уровень определится после знакомства"}
              </p>
            </div>
          </div>
          {profile.current && <p className="mt-4 text-[13px] text-ivory-60">Горит: {profile.current}</p>}
          <ul className="mt-5 divide-y divide-hair border-t border-hair">
            {tasks.map((t) => (
              <li key={t.title} className={`flex items-center justify-between gap-4 py-3 text-[14px] ${t.status === "locked" ? "opacity-45" : ""}`}>
                <span className="flex min-w-0 items-center gap-3">
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: nx(t.nexus).color }} />
                  <span className={t.status === "done" ? "text-ivory-60 line-through decoration-hair-strong" : ""}>{t.title}</span>
                </span>
                <span className="shrink-0 text-[11px]" style={{ color: STATUS[t.status].color }}>
                  {STATUS[t.status].label}
                </span>
              </li>
            ))}
          </ul>
        </article>

        <p className="caps mb-4 mt-8">Подключить</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {SLOTS.map((s) => {
            const locked = s.gated && !unlocked.includes("tech");
            return (
              <li key={s.role} className={`flex items-center gap-4 rounded-[18px] border border-dashed border-hair-strong p-4 ${locked ? "opacity-45" : ""}`}>
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-dashed border-hair-strong text-ivory-40" aria-hidden>
                  +
                </span>
                <span className="min-w-0 flex-1">
                  <span className="serif block text-[19px] leading-none">{s.role}</span>
                  <span className="mt-1.5 block truncate text-[11px] text-ivory-40">видит: {s.sees.map((id) => nx(id).title).join(", ")}</span>
                </span>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setNote(`Приглашения откроются в ранней версии. Роль «${s.role}» уже предусмотрена.`)}
                  className="btn-atelier !min-h-9 !px-4 text-[12px] disabled:pointer-events-none"
                >
                  {locked ? "после гейта" : "Пригласить"}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 min-h-5 text-[12px] text-ivory-60" aria-live="polite">
          {note}
        </p>
      </div>
    </Window>
  );
}
