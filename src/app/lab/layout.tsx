import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";

const golos = Golos_Text({ variable: "--font-label", subsets: ["latin", "cyrillic"], weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  title: "Foundation — радиант Нексусов",
  robots: { index: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  // canvas читает --font-label для подписей узлов
  return <div className={golos.variable} style={{ fontFamily: "var(--font-label)" }}>{children}</div>;
}
