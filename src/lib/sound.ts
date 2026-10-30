/**
 * Процедурный звук без ассетов (WebAudio): тёплый эмбиент-пэд и мягкие «колокольчики»
 * на ответы Ментора. Выключен по умолчанию, включается только жестом пользователя.
 */
type Engine = { ctx: AudioContext; master: GainNode; stopPad: () => void };

let engine: Engine | null = null;

function createPad(ctx: AudioContext, out: AudioNode) {
  // Fmaj9 в низком регистре: F2 · C3 · A3 · E4 · G4
  const freqs = [87.31, 130.81, 220, 329.63, 392];
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 900;
  filter.Q.value = 0.4;
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.05;
  lfoGain.gain.value = 380;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();
  filter.connect(out);

  const oscs = freqs.flatMap((f, i) =>
    [-4, 4].map((detune) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i < 2 ? "sine" : "triangle";
      o.frequency.value = f;
      o.detune.value = detune;
      g.gain.value = 0.05 / (i + 1);
      o.connect(g).connect(filter);
      o.start();
      return o;
    }),
  );
  return () => {
    oscs.forEach((o) => o.stop());
    lfo.stop();
  };
}

export const sound = {
  start() {
    if (typeof window === "undefined") return;
    if (!engine) {
      const ctx = new AudioContext();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      engine = { ctx, master, stopPad: createPad(ctx, master) };
    }
    const { ctx, master } = engine;
    void ctx.resume();
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0.55, ctx.currentTime, 1.2);
  },
  stop() {
    if (!engine) return;
    const { ctx, master } = engine;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  },
  chime(kind: "soft" | "up" | "down" = "soft") {
    if (!engine) return;
    const { ctx, master } = engine;
    const notes = kind === "up" ? [659.25, 987.77] : kind === "down" ? [392, 293.66] : [783.99];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * 0.14;
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.connect(g).connect(master);
      o.start(t);
      o.stop(t + 1.7);
    });
  },
};
