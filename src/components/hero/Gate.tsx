"use client";

import { useEffect, useRef, useState } from "react";
import { useFoundation } from "@/store/foundation";
import { RadiantMark } from "./RadiantMark";

/**
 * Вход в стиле Atelier: книжная типографика, выбор «со звуком / без».
 * Уход — медленное «растворение» backdrop-blur 20px → 0.
 */
export function Gate() {
  const phase = useFoundation((s) => s.phase);
  const enter = useFoundation((s) => s.enter);
  const [mounted, setMounted] = useState(true);
  const first = useRef<HTMLButtonElement>(null);
  const open = phase === "gate";

  useEffect(() => {
    if (open) {
      first.current?.focus({ preventScroll: true });
      document.documentElement.style.overflow = "hidden";
      return;
    }
    document.documentElement.style.overflow = "";
    const t = setTimeout(() => setMounted(false), 1800);
    return () => clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
      className="gate grain fixed inset-0 z-[60] flex items-center justify-center"
      data-open={open}
    >
      <div className="gate-inner flex flex-col items-center px-6 text-center">
        <RadiantMark size={44} className="gate-mark mb-10 text-ivory" />
        <p className="caps mb-6">Ателье фаундеров</p>
        <h1 id="gate-title" className="serif text-[clamp(56px,11vw,148px)] leading-[0.9] tracking-[0.04em]">
          Foundation
        </h1>
        <p className="serif mt-5 text-[clamp(20px,2.4vw,30px)] italic text-ivory-60">искусство не спешить с кодом</p>
        <span className="my-12 h-px w-16 bg-hair-strong" aria-hidden />
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-8">
          <button ref={first} type="button" onClick={() => enter(true)} className="btn-atelier btn-atelier--sun min-w-[220px]">
            <SoundGlyph /> Войти со звуком
          </button>
          <button type="button" onClick={() => enter(false)} className="link-quiet text-sm text-ivory-60">
            Без звука
          </button>
        </div>
      </div>
    </div>
  );
}

function SoundGlyph() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {[0.5, 1, 0.7].map((h, i) => (
        <span key={i} className="eq-bar w-[2px] rounded-full bg-current" style={{ height: `${h * 100}%`, animationDelay: `${i * 0.18}s` }} />
      ))}
    </span>
  );
}
