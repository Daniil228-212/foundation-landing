/**
 * Нексусы по Product Architecture Framework (С. Тихомиров), схемы 1–4.
 * Каждая цепочка «A → B → C» из схем — это связь родитель → потомок.
 * Узел с несколькими входящими связями (например, «База исследований и экспериментов»)
 * получает одного родителя для раскладки, остальные связи идут в `links`.
 */

export type PafNexusId = "market" | "product" | "growth" | "company";

export type PafNode = {
  id: string;
  label: string;
  nexus: PafNexusId;
  parent: string | null; // null — сам Нексус
  links?: string[]; // дополнительные связи из схем
};

export const PAF_NEXUSES: { id: PafNexusId; label: string; full: string; color: string; goal: string }[] = [
  { id: "market", label: "Рынок", full: "Нексус рынка", color: "#8fe9ff", goal: "Поиск возможностей и угроз" },
  { id: "product", label: "Продукт", full: "Нексус продукта", color: "#a48cff", goal: "Монетизируемая ценность и time-to-market" },
  { id: "growth", label: "Рост", full: "Нексус роста", color: "#ff7ad9", goal: "Чистая прибыль и time-to-profit" },
  { id: "company", label: "Компания", full: "Нексус компании", color: "#5cf2c2", goal: "Инкремент миссии при минимуме ресурсов" },
];

type Row = [id: string, label: string, parent: string, links?: string[]];

const MARKET: Row[] = [
  ["m-seg", "Сегменты потребителей", "market"],
  ["m-beh", "Поведение сегмента", "m-seg"],
  ["m-needs", "Потребности сегмента", "m-beh"],
  ["m-volume", "Объём рынка", "m-beh"],
  ["m-barriers", "Преграды смены продукта", "m-needs"],
  ["m-compmap", "Карта конкурентов", "market"],
  ["m-comp", "Конкурент", "m-compmap"],
  ["m-compprod", "Продукт конкурента", "m-comp"],
  ["m-suppliers", "Поставщики", "market"],
  ["m-resources", "Ресурсы", "m-suppliers"],
  ["m-regulators", "Регуляторы", "market"],
  ["m-regreq", "Требования регуляторов", "m-regulators"],
  ["m-trends", "Тренды", "market"],
];

const PRODUCT: Row[] = [
  ["p-seg", "Сегменты потребителей", "product", ["m-seg"]],
  ["p-beh", "Поведение сегмента", "p-seg", ["m-beh"]],
  ["p-needs", "Потребности сегмента", "p-beh", ["m-needs"]],
  ["p-aha", "Aha Moment", "p-beh"],
  ["p-usage", "Показатели используемости", "p-beh"],
  ["p-qual", "Качественные показатели", "p-usage"],
  ["p-feedback", "Обратная связь от потребителей", "p-qual"],
  ["p-quant", "Количественные показатели", "p-usage"],
  ["p-featmap", "Карта свойств продукта", "product"],
  ["p-feature", "Свойство / Фича", "p-featmap"],
  ["p-value", "Ценностные предложения", "p-feature"],
  ["p-basevalue", "Базовая ценность", "p-value"],
  ["p-addvalue", "Добавочная ценность", "p-value"],
  ["p-ui", "Карта интерфейсов", "p-feature"],
  ["p-tech", "Техническая реализация", "p-feature"],
  ["p-reqs", "Функциональные и нефункциональные требования", "p-feature"],
  ["p-prd", "PRD", "product"],
  ["p-changelog", "Change Log", "p-prd"],
  ["p-release", "Release Notes", "p-changelog"],
  ["p-brand", "Бренд", "product"],
  ["p-position", "Позиционирование", "p-brand"],
  ["p-diff", "Точки дифференциации", "p-position"],
];

const GROWTH: Row[] = [
  ["g-seg", "Сегменты ЦА", "growth", ["p-seg"]],
  ["g-segchar", "Характеристики сегмента", "g-seg"],
  ["g-monet", "Схема монетизации", "growth"],
  ["g-offers", "Офферы", "g-monet"],
  ["g-creatives", "Креативы", "g-offers"],
  ["g-usp", "УТП", "g-offers"],
  ["g-channels", "Каналы привлечения", "growth"],
  ["g-funnel", "Структура воронки", "g-channels"],
  ["g-metrics", "Показатели", "g-funnel"],
  ["g-loops", "Петли роста", "g-funnel"],
  ["g-engage", "Механики вовлечения", "g-funnel"],
  ["g-kit", "Sales & Marketing Kit", "growth"],
  ["g-script", "Скрипт продаж", "g-kit", ["g-usp"]],
  ["g-invest", "Инвестиционная модель", "growth"],
  ["g-pnl", "P&L", "g-invest"],
  ["g-media", "Медиа план", "g-pnl"],
];

const COMPANY: Row[] = [
  ["c-org", "Организационная структура", "company"],
  ["c-decisions", "Принципы принятия решений", "company"],
  ["c-team", "Команда", "company"],
  ["c-employee", "Сотрудник", "c-team"],
  ["c-jd", "Описание должности", "c-employee"],
  ["c-skills", "Навыки", "c-employee"],
  ["c-retro", "Результаты ретроспектив", "c-team"],
  ["c-metrics", "Показатели", "c-team", ["c-hierarchy"]],
  ["c-goals", "Карта целей", "company"],
  ["c-hierarchy", "Иерархия метрик", "company"],
  ["c-crossproj", "Кросс-функциональные проекты", "c-hierarchy"],
  ["c-processes", "Процессы", "company"],
  ["c-create", "Процессы создания ценности", "c-processes"],
  ["c-distrib", "Процессы дистрибуции ценности", "c-processes"],
  ["c-monet", "Процессы монетизации ценности", "c-processes"],
  ["c-change", "Процессы изменений", "c-processes"],
  ["c-research", "База исследований и экспериментов", "c-distrib", ["c-monet", "c-change"]],
  ["c-resources", "Ресурсы", "company", ["m-resources"]],
];

const NEXUS_OF: Record<string, PafNexusId> = { m: "market", p: "product", g: "growth", c: "company" };

export const PAF_NODES: PafNode[] = [
  ...PAF_NEXUSES.map((n) => ({ id: n.id, label: n.full, nexus: n.id, parent: null })),
  ...[...MARKET, ...PRODUCT, ...GROWTH, ...COMPANY].map(([id, label, parent, links]) => ({
    id,
    label,
    nexus: NEXUS_OF[id[0]],
    parent,
    links,
  })),
];
