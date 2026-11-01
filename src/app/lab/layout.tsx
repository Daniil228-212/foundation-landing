import type { Metadata } from "next";
import { RussoOneFont } from "@/components/radiant/fonts";

export const metadata: Metadata = {
  title: "Foundation — радиант Нексусов",
  robots: { index: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  // canvas читает --font-label для подписей узлов
  return <div className={RussoOneFont.variable}>{children}</div>;
}
