import type { Metadata, Viewport } from "next";
import { Onest, Unbounded } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "600", "800"],
  display: "swap",
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Foundation — ИИ-ментор для фаундеров",
  description:
    "Ментор, который проверяет гипотезы и не пускает в разработку, пока проблема не подтверждена. От идеи до первых продаж.",
  openGraph: {
    title: "Foundation — ИИ-ментор для фаундеров",
    description: "От идеи до первых продаж. Ранний доступ для первой когорты.",
    locale: "ru_RU",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#04050c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${unbounded.variable} ${onest.variable}`}>
      <body className="antialiased">
        <a href="#mentor" className="sr-only-focusable fixed left-4 top-4 z-[100] btn-sun">
          Перейти к демо Ментора
        </a>
        {children}
      </body>
    </html>
  );
}
