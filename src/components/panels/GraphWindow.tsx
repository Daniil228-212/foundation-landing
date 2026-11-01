"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { NODE_STATUS } from "@/content/nexus";
import { PAF_NEXUSES, PAF_NODES } from "@/content/pafNexus";
import type { CortexNode } from "@/lib/mentorScript";
import { RussoOneFont } from "@/components/radiant/fonts";
import type { RadiantFact, RadiantSelection } from "@/components/radiant/NexusRadiant";
import { useFoundation } from "@/store/foundation";
import { Window } from "./Window";

const NexusRadiant = dynamic(() => import("@/components/radiant/NexusRadiant").then((m) => m.NexusRadiant), { ssr: false });

/** Куда в структуре PAF ложится факт из диалога с Ментором */
function pafIdFor(n: CortexNode): string {
  if (n.nexus === "ops") return n.kind === "hypothesis" ? "c-goals" : "c-employee";
  switch (n.kind) {
    case "idea":
      return "market";
    case "audience":
      return "m-seg";
    case "alternative":
      return "m-comp";
    case "pain":
      return "m-needs";
    case "feature":
      return "p-feature";
    case "metric":
      return /cac|ltv/i.test(n.label) ? "g-pnl" : "p-quant";
    default:
      return n.nexus === "product" ? "product" : n.nexus === "growth" ? "growth" : "market";
  }
}

export function GraphWindow() {
  const nodes = useFoundation((s) => s.nodes);
  const facts = useMemo<RadiantFact[]>(() => nodes.map((n) => ({ pafId: pafIdFor(n), label: n.label, status: n.status })), [nodes]);
  const [selected, setSelected] = useState<RadiantSelection>(null);
  const [request, setRequest] = useState<{ id: string | null; n: number }>({ id: null, n: 0 });
  const focus = (id: string | null) => setRequest((r) => ({ id, n: r.n + 1 }));

  // спелость контекста: доля узлов Нексуса, в которых уже есть факты
  const ripeness = PAF_NEXUSES.map((nx) => {
    const ids = PAF_NODES.filter((n) => n.nexus === nx.id).map((n) => n.id);
    const filled = new Set(facts.filter((f) => ids.includes(f.pafId)).map((f) => f.pafId)).size;
    return { ...nx, filled, total: ids.length };
  });

  const aside = (
    <div className="space-y-7">
      <section>
        <p className="caps mb-4">Нексусы</p>
        <ul className="space-y-3">
          {ripeness.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => focus(n.id)} aria-pressed={selected?.id === n.id} className="group w-full text-left">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="serif text-[20px] leading-none transition-colors group-hover:text-sun" style={selected?.id === n.id ? { color: n.color } : undefined}>
                    {n.full}
                  </span>
                  <span className="text-[11px] tabular-nums text-ivory-40">
                    {n.filled}/{n.total}
                  </span>
                </span>
                <span className="mt-2 block h-px w-full bg-hair">
                  <span
                    className="block h-px origin-left transition-transform duration-[1600ms] ease-[var(--ease-atelier)]"
                    style={{ background: n.color, transform: `scaleX(${n.filled / n.total})` }}
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12px] leading-relaxed text-ivory-40">Спелость контекста: сколько узлов Нексуса уже наполнены фактами.</p>
      </section>

      <section aria-live="polite">
        <p className="caps mb-3">Узел</p>
        {selected ? (
          <div>
            <p className="text-[12px] leading-relaxed text-ivory-40">{selected.path.slice(0, -1).join(" → ")}</p>
            <p className="serif mt-1 text-[24px] leading-tight">{selected.label}</p>
            {selected.facts.length > 0 ? (
              <ul className="mt-4 space-y-2.5">
                {selected.facts.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] leading-snug">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: NODE_STATUS[f.status].color }} />
                    <span>
                      {f.label}
                      <span className="block text-[11px] text-ivory-40">{NODE_STATUS[f.status].label.toLowerCase()}</span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[13px] leading-relaxed text-ivory-40">Пусто. Ментор заполнит узел, когда в диалоге появятся факты по нему.</p>
            )}
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-ivory-40">
            Нажмите на Нексус или узел. Колесо или щипок — приближение, перетаскивание — вращение, Esc — исходный вид.
          </p>
        )}
      </section>

      <section>
        <p className="caps mb-3">Статус факта</p>
        <ul className="grid grid-cols-2 gap-2 text-[12px] text-ivory-60">
          {Object.values(NODE_STATUS).map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );

  return (
    <Window id="graph" eyebrow="Кортекс · Нексусы проекта" title="Граф проекта" aside={aside}>
      <div className={`${RussoOneFont.variable} absolute inset-0`} style={{ background: "radial-gradient(60% 60% at 50% 50%, #0a1020 0%, #03050b 75%)" }}>
        <NexusRadiant facts={facts} onSelect={setSelected} focusRequest={request} showHint={false} />
      </div>
    </Window>
  );
}
