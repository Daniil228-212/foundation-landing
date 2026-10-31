import type { NexusId } from "./nexus";
import type { IdeaType } from "@/lib/mentorScript";

/**
 * Эксперты для интервью.
 * ВАЖНО: пока это примеры профилей без имён, фото и названий компаний —
 * реальных людей и бренды добавляем только с их согласия (поля name/photo/company).
 */
export type Expert = {
  id: string;
  sphere: string;
  role: string;
  expertise: string;
  nexus: NexusId[];
  hue: string;
  name?: string;
  photo?: string;
  company?: string;
  /** для каких идей Ментор порекомендует этого эксперта */
  fits: IdeaType[];
};

export const EXPERTS: Expert[] = [
  {
    id: "fintech",
    sphere: "Финтех",
    role: "Топ-менеджер цифрового банка",
    expertise: "Депонирование средств, блокчейн-расчёты, платёжная инфраструктура",
    nexus: ["market", "ops"],
    hue: "#8fb5ae",
    fits: ["b2b"],
  },
  {
    id: "accelerator",
    sphere: "Венчур",
    role: "Директор корпоративного акселератора",
    expertise: "Отбор стартапов, пилоты с корпорациями, подготовка к питчу",
    nexus: ["market", "growth"],
    hue: "#cfa874",
    fits: ["generic"],
  },
  {
    id: "b2b-sales",
    sphere: "B2B SaaS",
    role: "Основатель SaaS-компании",
    expertise: "Первые продажи в B2B, ценообразование, работа с ЛПР",
    nexus: ["growth", "market"],
    hue: "#a99fc6",
    fits: ["b2b"],
  },
  {
    id: "marketplace",
    sphere: "E-commerce",
    role: "CPO маркетплейса",
    expertise: "Двусторонние рынки, проблема курицы и яйца, юнит-экономика сделки",
    nexus: ["product", "growth"],
    hue: "#d29f98",
    fits: ["marketplace"],
  },
  {
    id: "growth",
    sphere: "Маркетинг",
    role: "Руководитель роста потребительского сервиса",
    expertise: "Каналы привлечения, CAC, удержание и сообщества",
    nexus: ["growth"],
    hue: "#ffd54f",
    fits: ["social", "mobile"],
  },
  {
    id: "product",
    sphere: "Продукт",
    role: "Продуктовый директор мобильного приложения",
    expertise: "Discovery, проблемные интервью, метрики активации",
    nexus: ["product", "market"],
    hue: "#a9bb93",
    fits: ["mobile", "social"],
  },
  {
    id: "legal",
    sphere: "Право",
    role: "Юрист по венчурным сделкам",
    expertise: "Доли основателей, опционы, договоры с первыми инвесторами",
    nexus: ["ops"],
    hue: "#b8b2a6",
    fits: [],
  },
  {
    id: "cto",
    sphere: "Инженерия",
    role: "CTO технологической компании",
    expertise: "Архитектура MVP, выбор стека, стоимость инфраструктуры",
    nexus: ["tech", "product"],
    hue: "#cfa874",
    fits: [],
  },
];
