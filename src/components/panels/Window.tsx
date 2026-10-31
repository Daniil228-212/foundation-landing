"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useFoundation, type Panel } from "@/store/foundation";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Выпадающее окно: «проявляется» из размытия и опускается от правой панели.
 * Закрытие — быстрее открытия (asymmetric timing), Esc и клик по фону.
 */
export function Window({
  id,
  title,
  eyebrow,
  children,
  aside,
}: {
  id: Exclude<Panel, null>;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const open = useFoundation((s) => s.panel === id);
  const setPanel = useFoundation((s) => s.setPanel);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      returnTo.current?.focus?.({ preventScroll: true });
    };
  }, [open, setPanel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.6, ease: EASE } }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
        >
          <button
            type="button"
            aria-label="Закрыть окно"
            tabIndex={-1}
            onClick={() => setPanel(null)}
            className="absolute inset-0 cursor-default bg-graphite/60 backdrop-blur-md"
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`win-${id}`}
            className="absolute inset-x-3 bottom-3 top-[max(12px,env(safe-area-inset-top))] flex flex-col overflow-hidden rounded-[28px] border border-hair-strong bg-graphite-2/95 shadow-[0_40px_120px_-20px_rgba(0,0,0,.8)] sm:inset-x-6 sm:bottom-6 sm:top-20 lg:left-auto lg:right-[var(--gutter)] lg:top-20 lg:w-[min(1180px,calc(100vw-2*var(--gutter)))]"
            style={{ transformOrigin: "top right" }}
            initial={{ opacity: 0, filter: "blur(20px)", transform: "translateY(-16px) scale(0.98)" }}
            animate={{ opacity: 1, filter: "blur(0px)", transform: "translateY(0px) scale(1)", transition: { duration: 0.9, ease: EASE } }}
            exit={{ opacity: 0, filter: "blur(8px)", transform: "translateY(-8px) scale(0.99)", transition: { duration: 0.22, ease: EASE } }}
          >
            <header className="flex items-center justify-between gap-4 border-b border-hair px-5 py-4 sm:px-7">
              <div>
                <p className="caps">{eyebrow}</p>
                <h2 id={`win-${id}`} className="serif mt-1 text-[28px] leading-none sm:text-[34px]">
                  {title}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setPanel(null)}
                aria-label="Закрыть"
                className="grid size-10 place-items-center rounded-full border border-hair-strong text-ivory transition-transform duration-150 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div className="relative min-h-0 flex-1">{children}</div>
              {aside && (
                <aside className="max-h-[40%] shrink-0 overflow-y-auto border-t border-hair p-5 [overscroll-behavior:contain] sm:p-7 lg:max-h-none lg:w-[320px] lg:border-l lg:border-t-0">
                  {aside}
                </aside>
              )}
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
