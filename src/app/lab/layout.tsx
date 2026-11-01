import type { Metadata } from "next";
import { Geologica, Golos_Text, Inter_Tight, Tektur, Unbounded } from "next/font/google";
import "./tokens.css";

// Кандидаты шрифтов загружаются только на тестовой странице
const unbounded = Unbounded({ variable: "--f-unbounded", subsets: ["latin", "cyrillic"], weight: ["300", "500"], display: "swap" });
const golos = Golos_Text({ variable: "--f-golos", subsets: ["latin", "cyrillic"], weight: ["400", "500"], display: "swap" });
const tektur = Tektur({ variable: "--f-tektur", subsets: ["latin", "cyrillic"], weight: ["500", "700"], display: "swap" });
const interTight = Inter_Tight({ variable: "--f-intertight", subsets: ["latin", "cyrillic"], weight: ["400", "500"], display: "swap" });
const geologica = Geologica({ variable: "--f-geologica", subsets: ["latin", "cyrillic"], weight: ["200", "400", "600"], display: "swap" });

export const metadata: Metadata = {
  title: "Foundation — дизайн-система (тест)",
  robots: { index: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${unbounded.variable} ${golos.variable} ${tektur.variable} ${interTight.variable} ${geologica.variable}`}>{children}</div>;
}
