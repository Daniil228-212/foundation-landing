/**
 * Таксономия «Кортекса» — 4 Нексуса + заблокированная ветка «Разработка».
 *
 * Структура опирается на Product Architecture Framework С. Тихомирова
 * (продукт как цифровой двойник-«Нексус», управление рисками, а не потерями,
 * жизненный цикл: Discovery → Launch → Growth → Refactoring → Competition → Evolution).
 * Разбиение ветвей на подветви — наша интерпретация; сверить с первоисточником
 * (productframework.ru, канал «Борода продакта»).
 */

export type NexusId = "market" | "product" | "growth" | "ops" | "tech";

export type NexusBranch = {
  id: string;
  title: string;
  children?: NexusBranch[];
};

export type Nexus = {
  id: NexusId;
  title: string;
  latin: string;
  color: string; // css var
  locked?: boolean;
  branches: NexusBranch[];
};

export const NEXUSES: Nexus[] = [
  {
    id: "market",
    title: "Рынок",
    latin: "Nexus Market",
    color: "var(--nx-market)",
    branches: [
      {
        id: "segments",
        title: "Сегменты и ЦА",
        children: [
          { id: "jtbd", title: "Работы (JTBD)" },
          { id: "personas", title: "Профили клиентов" },
        ],
      },
      {
        id: "sizing",
        title: "Объём рынка",
        children: [
          { id: "tam", title: "TAM / SAM / SOM" },
          { id: "trends", title: "Тренды" },
        ],
      },
      {
        id: "alternatives",
        title: "Альтернативы",
        children: [
          { id: "competitors", title: "Конкуренты" },
          { id: "status-quo", title: "Как решают сейчас" },
        ],
      },
      { id: "channels", title: "Каналы доступа" },
    ],
  },
  {
    id: "product",
    title: "Продукт",
    latin: "Nexus Product",
    color: "var(--nx-product)",
    branches: [
      {
        id: "discovery",
        title: "Discovery",
        children: [
          { id: "problem-interviews", title: "Проблемные интервью" },
          { id: "hypotheses", title: "Гипотезы и риски" },
          { id: "value-prop", title: "Ценностное предложение" },
          { id: "prototypes", title: "Прототипы и тесты" },
        ],
      },
      {
        id: "delivery",
        title: "Delivery",
        children: [
          { id: "mvp", title: "MVP-скоуп" },
          { id: "prd", title: "PRD" },
          { id: "backlog", title: "Бэклог и приоритеты (ICE/RICE)" },
          { id: "releases", title: "Релизы" },
        ],
      },
      { id: "ux", title: "UX и дизайн" },
    ],
  },
  {
    id: "growth",
    title: "Рост",
    latin: "Nexus Growth",
    color: "var(--nx-growth)",
    branches: [
      {
        id: "unit-economics",
        title: "Юнит-экономика",
        children: [
          { id: "cac", title: "CAC" },
          { id: "ltv", title: "LTV / ARPU" },
        ],
      },
      {
        id: "metrics",
        title: "Метрики",
        children: [
          { id: "north-star", title: "North Star" },
          { id: "metric-tree", title: "Дерево метрик" },
        ],
      },
      { id: "funnel", title: "Воронка (AARRR)" },
      { id: "pricing", title: "Монетизация и цена" },
      { id: "launch", title: "Запуск и первые продажи" },
    ],
  },
  {
    id: "ops",
    title: "Операционная модель",
    latin: "Nexus Operations",
    color: "var(--nx-ops)",
    branches: [
      { id: "team", title: "Команда и роли" },
      { id: "experts", title: "Эксперты и менторы" },
      { id: "processes", title: "Процессы и ритм" },
      { id: "finance", title: "Финансы и бюджет" },
      { id: "legal", title: "Юр. и инфраструктура" },
    ],
  },
  {
    id: "tech",
    title: "Разработка",
    latin: "Nexus Tech",
    color: "var(--nx-tech)",
    locked: true,
    branches: [
      { id: "stack", title: "Стек" },
      { id: "architecture", title: "Архитектура" },
      { id: "integrations", title: "Интеграции" },
    ],
  },
];

export type NodeKind = "idea" | "hypothesis" | "audience" | "alternative" | "risk" | "metric" | "stack";
export type NodeStatus = "assume" | "check" | "ok" | "fail";

export const NODE_KIND_LABEL: Record<NodeKind, string> = {
  idea: "Идея",
  hypothesis: "Гипотеза",
  audience: "Аудитория",
  alternative: "Альтернатива",
  risk: "Риск",
  metric: "Метрика",
  stack: "Стек",
};

export const NODE_STATUS: Record<NodeStatus, { label: string; color: string }> = {
  assume: { label: "Допущение", color: "var(--st-assume)" },
  check: { label: "Проверяется", color: "var(--st-check)" },
  ok: { label: "Подтверждено", color: "var(--st-ok)" },
  fail: { label: "Опровергнуто", color: "var(--st-fail)" },
};
