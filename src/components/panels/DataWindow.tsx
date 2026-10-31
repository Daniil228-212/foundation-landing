"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { countTree, projectTree, routeFile, type FileNode } from "@/content/projectFiles";
import { useFoundation } from "@/store/foundation";
import { Window } from "./Window";

const EASE = [0.16, 1, 0.3, 1] as const;

export function FolderGlyph({ open = false }: { open?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      {open ? <path d="M3 7h6l2 2h10v2H6l-3 8V7Zm3 4h15l-3 8H3" /> : <path d="M3 6h6l2 2h10v11H3z" />}
    </svg>
  );
}
export function FileGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
      <path d="M7 3h7l5 5v13H7zM14 3v5h5" />
    </svg>
  );
}

function Tree({ node, depth, open, toggle, path }: { node: FileNode; depth: number; open: Set<string>; toggle: (p: string) => void; path: string }) {
  if (node.kind === "file")
    return (
      <motion.li
        layout
        initial={node.fresh ? { opacity: 0, filter: "blur(10px)" } : false}
        animate={{ opacity: 1, filter: "blur(0px)", transition: { duration: 1.2, ease: EASE } }}
        className={`flex items-center gap-3 rounded-lg py-1.5 pr-2 text-[13px] ${node.locked ? "opacity-40" : ""}`}
        style={{ paddingLeft: depth * 18 + 8 }}
      >
        <span className="text-ivory-40">
          <FileGlyph />
        </span>
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
        {node.meta && <span className={`shrink-0 text-[11px] ${node.fresh ? "text-sun" : "text-ivory-40"}`}>{node.meta}</span>}
      </motion.li>
    );
  const isOpen = open.has(path);
  const c = countTree(node);
  return (
    <li>
      <button
        type="button"
        onClick={() => toggle(path)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 rounded-lg py-1.5 pr-2 text-left text-[14px] transition-colors hover:bg-white/[0.03]"
        style={{ paddingLeft: depth * 18 + 8 }}
      >
        <span className="text-ivory-60" style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform .2s" }}>
          ›
        </span>
        <span className={isOpen ? "text-sun" : "text-ivory-60"}>
          <FolderGlyph open={isOpen} />
        </span>
        <span className="flex-1">{node.name}</span>
        <span className="text-[11px] text-ivory-40">{node.meta ?? `${c.files}`}</span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto", transition: { duration: 0.35, ease: EASE } }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.18 } }}
            className="overflow-hidden"
          >
            {node.children?.map((ch) => (
              <Tree key={ch.name} node={ch} depth={depth + 1} open={open} toggle={toggle} path={`${path}/${ch.name}`} />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
}

export function useProjectTree() {
  const nodes = useFoundation((s) => s.nodes);
  const profile = useFoundation((s) => s.profile);
  const uploads = useFoundation((s) => s.uploads);
  return useMemo(() => projectTree(nodes, profile, uploads), [nodes, profile, uploads]);
}

export function DataWindow() {
  const tree = useProjectTree();
  const addUpload = useFoundation((s) => s.addUpload);
  const [open, setOpen] = useState<Set<string>>(new Set(["Проект/00 Входящие", "Проект/01 Рынок", "Проект/01 Рынок/Исследования"]));
  const [over, setOver] = useState(false);
  const toggle = (p: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(p)) n.delete(p);
      else n.add(p);
      return n;
    });

  const ingest = (names: string[]) => {
    names.forEach((name) => {
      addUpload(name, "00 Входящие");
      // демо авто-сортировки: через секунду файл уходит в свою папку
      setTimeout(() => {
        const dest = routeFile(name);
        addUpload(name, dest);
        const [a, b] = dest.split("/");
        setOpen((s) => new Set([...s, `Проект/${a}`, `Проект/${a}/${b}`]));
      }, 1400);
    });
  };

  const c = countTree(tree);

  return (
    <Window
      id="data"
      eyebrow="Общие данные"
      title="Файлы проекта"
      aside={
        <div className="space-y-6 text-[13px] leading-relaxed text-ivory-60">
          <div>
            <p className="caps mb-2">Как это работает</p>
            <p>Бросайте любые файлы: записи созвонов, таблицы, фото доски, PDF. ИИ распознаёт содержимое и раскладывает по Нексусам, а факты попадают в граф.</p>
          </div>
          <div>
            <p className="caps mb-2">Сейчас</p>
            <p>
              {c.files} файлов · {c.folders - 1} папок
            </p>
          </div>
          <p className="text-ivory-40">«из диалога» — создано Ментором по вашим ответам. Документы Delivery откроются после гейта.</p>
        </div>
      }
    >
      <div className="absolute inset-0 flex flex-col">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            ingest(Array.from(e.dataTransfer.files).map((f) => f.name));
          }}
          className={`m-4 flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-5 text-[13px] transition-colors sm:m-6 ${
            over ? "border-sun bg-sun/5 text-ivory" : "border-hair-strong text-ivory-60"
          }`}
        >
          <input type="file" multiple className="sr-only" onChange={(e) => ingest(Array.from(e.target.files ?? []).map((f) => f.name))} />
          <span className="text-sun">+</span> Перетащите файлы или выберите — разложим по папкам
        </label>
        <ul className="min-h-0 flex-1 overflow-y-auto px-2 pb-6 [overscroll-behavior:contain] sm:px-4" aria-label="Дерево файлов проекта">
          {tree.children!.map((ch) => (
            <Tree key={ch.name} node={ch} depth={0} open={open} toggle={toggle} path={`Проект/${ch.name}`} />
          ))}
        </ul>
      </div>
    </Window>
  );
}
