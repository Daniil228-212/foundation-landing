"use client";

import { create } from "zustand";
import type { NexusId } from "@/content/nexus";
import {
  classifyIdea,
  OPENING,
  respond,
  type CortexNode,
  type IdeaType,
  type Profile,
  type Step,
} from "@/lib/mentorScript";
import { sound } from "@/lib/sound";

export type Phase = "gate" | "intro" | "greeting" | "ready";
/** Состояние Ментора — им «дышит» радиант над кольцом */
export type MentorState = "idle" | "listening" | "thinking" | "challenging" | "approving" | "blocking";
export type Panel = "graph" | "data" | "team" | null;
export type Message = { id: number; from: "mentor" | "user"; text: string };

export const IDEA_EXAMPLES = ["Соцсеть для ", "SaaS для бизнеса: ", "Маркетплейс ", "Мобильное приложение для "];
export const SEEN_KEY = "fdn-intro-seen";

type State = {
  phase: Phase;
  soundOn: boolean;
  mentor: MentorState;
  focused: boolean;
  panel: Panel;
  messages: Message[];
  quick: string[];
  nodes: CortexNode[];
  profile: Profile;
  step: Step;
  retried: boolean;
  ideaType: IdeaType;
  unlocked: NexusId[];
  busy: boolean;
  uploads: { name: string; path: string }[];

  addUpload: (name: string, path: string) => void;
  enter: (withSound: boolean) => void;
  revealUI: () => void;
  finishIntro: () => void;
  skipIntro: () => void;
  toggleSound: () => void;
  setFocused: (f: boolean) => void;
  setPanel: (p: Panel) => void;
  send: (text: string) => void;
};

let msgId = 0;
let moodTimer: ReturnType<typeof setTimeout> | undefined;

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* приватный режим — просто покажем заставку снова */
  }
}

export const useFoundation = create<State>((set, get) => ({
  phase: "gate",
  soundOn: false,
  mentor: "idle",
  focused: false,
  panel: null,
  messages: [{ id: ++msgId, from: "mentor", text: OPENING }],
  quick: [],
  nodes: [],
  profile: {},
  step: "name",
  retried: false,
  ideaType: "generic",
  unlocked: ["market", "growth", "ops"],
  busy: false,
  uploads: [],

  // загрузка или «переезд» файла в папку (одно имя — одна запись)
  addUpload: (name, path) => set((s) => ({ uploads: [...s.uploads.filter((u) => u.name !== name), { name, path }] })),
  enter: (withSound) => {
    if (withSound) sound.start();
    markSeen();
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    set({ phase: reduce ? "ready" : "intro", soundOn: withSound });
  },
  revealUI: () => {
    if (get().phase === "intro") set({ phase: "greeting" });
    if (get().soundOn) sound.chime("up");
  },
  finishIntro: () => set({ phase: "ready" }),
  skipIntro: () => {
    markSeen();
    set({ phase: "ready" });
  },
  toggleSound: () => {
    const on = !get().soundOn;
    if (on) sound.start();
    else sound.stop();
    set({ soundOn: on });
  },
  setFocused: (f) => {
    const s = get();
    set({ focused: f });
    if (!s.busy && (s.mentor === "idle" || s.mentor === "listening")) set({ mentor: f ? "listening" : "idle" });
  },
  setPanel: (panel) => set({ panel }),

  send: (raw) => {
    const text = raw.trim();
    const s = get();
    if (!text || s.busy || s.phase !== "ready") return;

    const ideaType = s.step === "idea" ? classifyIdea(text) : s.ideaType;
    set({
      messages: [...s.messages, { id: ++msgId, from: "user", text }],
      mentor: "thinking",
      busy: true,
      quick: [],
      ideaType,
    });

    // короткая пауза — ответ ощущается взвешенным
    setTimeout(() => {
      const cur = get();
      const r = respond(cur.step, text, { type: ideaType, nodes: cur.nodes, retried: cur.retried, profile: cur.profile });
      const sameStep = r.next === cur.step;
      set({
        messages: [...cur.messages, { id: ++msgId, from: "mentor", text: r.text }],
        nodes: [...cur.nodes, ...r.nodes],
        profile: r.profile ?? cur.profile,
        quick: r.quick ?? (r.next === "idea" ? IDEA_EXAMPLES : []),
        step: r.next,
        retried: sameStep,
        unlocked: r.unlock && !cur.unlocked.includes(r.unlock) ? [...cur.unlocked, r.unlock] : cur.unlocked,
        mentor: r.mood,
        busy: false,
      });
      if (cur.soundOn) sound.chime(r.mood === "approving" ? "up" : r.mood === "blocking" ? "down" : "soft");
      clearTimeout(moodTimer);
      moodTimer = setTimeout(() => {
        const g = get();
        if (!g.busy) set({ mentor: g.focused ? "listening" : "idle" });
      }, 2600);
    }, 1200);
  },
}));
