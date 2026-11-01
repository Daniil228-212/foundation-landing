import { Russo_One } from "next/font/google";

/** Шрифт подписей радианта; canvas читает его через --font-label */
export const RussoOneFont = Russo_One({ variable: "--font-label", subsets: ["latin", "cyrillic"], weight: "400", display: "swap" });
