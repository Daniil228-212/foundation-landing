import type { Metadata, Viewport } from "next";
import { Inter, Noto_Serif_Display } from "next/font/google";
import "./globals.css";

const display = Noto_Serif_Display({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  display: "swap",
});

const ui = Inter({
  variable: "--font-ui",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Foundation — ИИ-ментор для фаундеров",
  description:
    "Ментор, который проверяет гипотезы и не пускает в разработку, пока проблема не подтверждена. От идеи до первых продаж.",
  openGraph: {
    title: "Foundation — искусство не спешить с кодом",
    description: "ИИ-ментор для инди-фаундеров. Ранний доступ для первой когорты.",
    locale: "ru_RU",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#3d3c44",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${display.variable} ${ui.variable}`} suppressHydrationWarning>
      <head>
        {/* повторный визит: прячем вход до гидратации, чтобы он не мигал */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("fdn-intro-seen"))document.documentElement.dataset.seen="1"}catch(e){}`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
