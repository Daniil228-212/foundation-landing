import { NexusRadiant } from "@/components/radiant/NexusRadiant";

/** Отдельная страница одного элемента: радиант с Нексусами PAF */
export default function Lab() {
  return (
    <main className="fixed inset-0 overflow-hidden" style={{ background: "radial-gradient(60% 60% at 50% 50%, #0a1020 0%, #03050b 70%)" }}>
      <NexusRadiant />
    </main>
  );
}
