import type { CortexNode, Profile } from "@/lib/mentorScript";

export type FileNode = {
  name: string;
  kind: "folder" | "file";
  meta?: string;
  fresh?: boolean; // появился из диалога
  locked?: boolean;
  children?: FileNode[];
};

/** Расширение → папка, куда автоматически раскладывается загруженный файл */
export function routeFile(name: string): string {
  const n = name.toLowerCase();
  if (/интервью|interview|созвон|\.m4a|\.mp3|\.wav/.test(n)) return "01 Рынок/Интервью";
  if (/\.xlsx|\.csv|\.numbers|юнит|unit|cac|ltv/.test(n)) return "03 Рост/Юнит-экономика";
  if (/\.fig|\.sketch|прототип|cjm|\.png|\.jpg|\.jpeg|\.heic/.test(n)) return "02 Продукт/Discovery";
  if (/prd|тз|спек|spec/.test(n)) return "02 Продукт/Delivery";
  if (/договор|бюджет|\.pdf/.test(n)) return "04 Операции/Финансы";
  return "01 Рынок/Исследования";
}

/** Дерево проекта: базовая структура по Нексусам + то, что появилось из диалога */
export function projectTree(nodes: CortexNode[], profile: Profile, uploads: { name: string; path: string }[]): FileNode {
  const has = (k: CortexNode["kind"]) => nodes.some((n) => n.kind === k && n.nexus !== "ops");
  const extra = (path: string): FileNode[] =>
    uploads.filter((u) => u.path === path).map((u) => ({ name: u.name, kind: "file", meta: "загружено", fresh: true }));
  const f = (name: string, meta?: string, fresh?: boolean, locked?: boolean): FileNode => ({ name, kind: "file", meta, fresh, locked });

  return {
    name: "Проект",
    kind: "folder",
    children: [
      {
        name: "00 Входящие",
        kind: "folder",
        meta: "авто-сортировка",
        children: [...extra("00 Входящие")],
      },
      {
        name: "01 Рынок",
        kind: "folder",
        children: [
          {
            name: "Интервью",
            kind: "folder",
            children: [f("Скрипт проблемного интервью.md", "шаблон"), ...extra("01 Рынок/Интервью")],
          },
          {
            name: "Исследования",
            kind: "folder",
            children: [
              ...(has("idea") ? [f("Идея и гипотезы.md", "из диалога", true)] : []),
              ...(has("audience") ? [f("Сегменты и ЦА.md", "из диалога", true)] : []),
              f("TAM · SAM · SOM.xlsx", "шаблон"),
              ...extra("01 Рынок/Исследования"),
            ],
          },
          {
            name: "Конкуренты",
            kind: "folder",
            children: [...(has("alternative") ? [f("Альтернативы и боли.md", "из диалога", true)] : [f("Карта альтернатив.md", "пусто")])],
          },
        ],
      },
      {
        name: "02 Продукт",
        kind: "folder",
        children: [
          {
            name: "Discovery",
            kind: "folder",
            children: [f("Ценностное предложение.md", has("feature") ? "из диалога" : "пусто", has("feature")), f("CJM.fig", "шаблон"), ...extra("02 Продукт/Discovery")],
          },
          {
            name: "Delivery",
            kind: "folder",
            children: [f("PRD v0.md", "после гейта", false, true), f("Бэклог · RICE.xlsx", "после гейта", false, true), ...extra("02 Продукт/Delivery")],
          },
        ],
      },
      {
        name: "03 Рост",
        kind: "folder",
        children: [
          {
            name: "Юнит-экономика",
            kind: "folder",
            children: [f("CAC · LTV.xlsx", has("metric") ? "из диалога" : "шаблон", has("metric")), ...extra("03 Рост/Юнит-экономика")],
          },
          f("Дерево метрик.md", "шаблон"),
        ],
      },
      {
        name: "04 Операции",
        kind: "folder",
        children: [
          f("Профиль фаундера.md", profile.name ? `${profile.name}` : "после знакомства", !!profile.name),
          { name: "Финансы", kind: "folder", children: [f("Бюджет на 3 месяца.xlsx", "шаблон"), ...extra("04 Операции/Финансы")] },
        ],
      },
    ],
  };
}

export function countTree(n: FileNode): { files: number; folders: number } {
  if (n.kind === "file") return { files: 1, folders: 0 };
  return (n.children ?? []).reduce(
    (acc, c) => {
      const r = countTree(c);
      return { files: acc.files + r.files, folders: acc.folders + r.folders };
    },
    { files: 0, folders: 1 },
  );
}
