"use client";

import { create } from "zustand";
import type { AgentId } from "@/content/agents";
import type { NexusId } from "@/content/nexus";
import {
  classifyIdea,
  OPENING,
  respond,
  type CortexNode,
  type IdeaType,
  type Step,
} from "@/lib/mentorScript";
import { sound } from "@/lib/sound";

export type Phase = "gate" | "intro" | "greeting" | "ready";
export type MascotState =
  | "greeting"
  | "idle"
  | "listening"
  | "thinking"
  | "challenging"
  | "approving"
  | "blocking";

export type Message = { id: number; from: "mentor" | "user"; text: string };

type State = {
  phase: Phase;
  soundOn: boolean;
  mascot: MascotState;
  focused: boolean;
  hoveredAgent: AgentId | null;
  messages: Message[];
  nodes: CortexNode[];
  step: Step;
  retried: boolean;
  ideaType: IdeaType;
  unlocked: NexusId[];
  busy: boolean;

  enter: (withSound: boolean) => void;
  revealUI: () => void;
  finishGreeting: () => void;
  skipIntro: () => void;
  toggleSound: () => void;
  setFocused: (f: boolean) => void;
  setHoveredAgent: (a: AgentId | null) => void;
  setMascot: (m: MascotState) => void;
  send: (text: string) => void;
};

let msgId = 0;
let moodTimer: ReturnType<typeof setTimeout> | undefined;

export const useFoundation = create<State>((set, get) => ({
  phase: "gate",
  soundOn: false,
  mascot: "idle",
  focused: false,
  hoveredAgent: null,
  messages: [{ id: ++msgId, from: "mentor", text: OPENING }],
  nodes: [],
  step: "idea",
  retried: false,
  ideaType: "generic",
  unlocked: ["market", "growth", "ops"],
  busy: false,

  enter: (withSound) => {
    if (withSound) sound.start();
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    set({ phase: reduce ? "ready" : "intro", soundOn: withSound, mascot: reduce ? "idle" : "greeting" });
  },
  revealUI: () => {
    if (get().phase === "intro") set({ phase: "greeting", mascot: "greeting" });
    if (get().soundOn) sound.chime("up");
  },
  finishGreeting: () => set({ phase: "ready", mascot: get().focused ? "listening" : "idle" }),
  skipIntro: () => set({ phase: "ready", mascot: "idle" }),
  toggleSound: () => {
    const on = !get().soundOn;
    if (on) sound.start();
    else sound.stop();
    set({ soundOn: on });
  },
  setFocused: (f) => {
    const s = get();
    set({ focused: f });
    if (s.busy || s.phase !== "ready") return;
    if (s.mascot === "idle" || s.mascot === "listening") set({ mascot: f ? "listening" : "idle" });
  },
  setHoveredAgent: (a) => set({ hoveredAgent: a }),
  setMascot: (m) => set({ mascot: m }),

  send: (raw) => {
    const text = raw.trim();
    const s = get();
    if (!text || s.busy || s.phase !== "ready") return;

    const ideaType = s.step === "idea" ? classifyIdea(text) : s.ideaType;
    set({
      messages: [...s.messages, { id: ++msgId, from: "user", text }],
      mascot: "thinking",
      busy: true,
      ideaType,
    });

    // «думает» — короткая пауза, чтобы ответ ощущался взвешенным
    setTimeout(() => {
      const cur = get();
      const r = respond(cur.step, text, { type: ideaType, nodes: cur.nodes, retried: cur.retried });
      const sameStep = r.next === cur.step;
      set({
        messages: [...cur.messages, { id: ++msgId, from: "mentor", text: r.text }],
        nodes: [...cur.nodes, ...r.nodes],
        step: r.next,
        retried: sameStep ? true : false,
        unlocked: r.unlock && !cur.unlocked.includes(r.unlock) ? [...cur.unlocked, r.unlock] : cur.unlocked,
        mascot: r.mood,
        busy: false,
      });
      if (cur.soundOn) sound.chime(r.mood === "approving" ? "up" : r.mood === "blocking" ? "down" : "soft");
      clearTimeout(moodTimer);
      moodTimer = setTimeout(() => {
        const g = get();
        if (!g.busy) set({ mascot: g.focused ? "listening" : "idle" });
      }, 2600);
    }, 1300);
  },
}));
