/**
 * Сценарный режим Ментора (без внешних API).
 * Чистые функции: классификация идеи, проверка «объективности» ответа,
 * извлечение сущностей → узлы Кортекса. В фазе 4 оборачивается в XState-автомат.
 */
import type { NexusId, NodeKind, NodeStatus } from "@/content/nexus";

export type IdeaType = "b2b" | "marketplace" | "social" | "mobile" | "generic";
export type MascotMood = "challenging" | "approving" | "blocking" | "listening";

export type Step =
  | "name"
  | "background"
  | "launches"
  | "level"
  | "current"
  | "idea"
  | "payer"
  | "barriers"
  | "economics"
  | "feature"
  | "usage"
  | "done";

export type CortexNode = {
  id: string;
  nexus: NexusId;
  kind: NodeKind | "pain" | "feature";
  label: string;
  status: NodeStatus;
  /** жёсткие связи: свойство продукта → боль рынка и т. п. */
  links: string[];
};

const RX: Record<Exclude<IdeaType, "generic">, RegExp> = {
  b2b: /(b2b|saas|crm|erp|бизнес|компан|салон|ресторан|клиник|автоматиз|сотрудник|отдел|бухгалт|барбершоп|магазин)/i,
  marketplace: /(маркетплейс|площадк|продавц|покупател|исполнител|заказчик|агрегатор)/i,
  social: /(соцсет|сообществ|друз|знакомств|подписчик|контент|блог|нетворк)/i,
  mobile: /(приложени|мобильн|ios|android|трекер|привычк)/i,
};

export function classifyIdea(text: string): IdeaType {
  for (const k of ["marketplace", "b2b", "social", "mobile"] as const) if (RX[k].test(text)) return k;
  return "generic";
}

/** Есть ли в ответе хоть что-то проверяемое: число, источник, факт интервью */
export function isObjective(text: string) {
  return /\d|интервью|опрос|поговорил|созвон|источник|по данным|статистик|отчёт|отчет|%|тыс|млн|₽|руб|\$/i.test(text);
}

export function wantsToSkip(text: string) {
  return /(код|разработ|напиши приложение|сделай mvp|запусти|программ|стек)/i.test(text);
}

const Q: Record<IdeaType, { payer: string; barriers: string; economics: string }> = {
  b2b: {
    payer: "Кто в компании подписывает счёт? Сколько таких компаний вы можете назвать поимённо?",
    barriers: "Чем они пользуются сейчас — Excel, конкурент, менеджер? Почему до сих пор не заменили?",
    economics: "Сколько стоит привести одну компанию и сколько она заплатит за год?",
  },
  marketplace: {
    payer: "Кто платит комиссию — продавец или покупатель? Сколько их на старте в одном городе или нише?",
    barriers: "Где они находят друг друга сейчас и почему это не работает?",
    economics: "Сколько стоит привлечь одну сторону и сколько сделок нужно, чтобы она окупилась?",
  },
  social: {
    payer: "Соцсети живут рекламой или подпиской. Кто из них заплатит вам и сколько таких людей?",
    barriers: "Почему эти люди уйдут из Telegram или VK? Что вы дадите, чего там нет?",
    economics: "Сколько стоит один активный пользователь и сколько он принесёт за год?",
  },
  mobile: {
    payer: "Кто платит за приложение и сколько таких людей вы знаете лично?",
    barriers: "Как они решают задачу сейчас — блокнот, другое приложение, никак?",
    economics: "Сколько стоит одна установка и какая доля платит после пробного периода?",
  },
  generic: {
    payer: "Кто конкретно заплатит за это? Сколько таких людей или компаний?",
    barriers: "Почему это не решили до вас? Чем пользуются сейчас?",
    economics: "Сколько стоит привлечь одного клиента и сколько он принесёт?",
  },
};

export const OPENING = "Привет. Прежде чем говорить об идее, познакомимся. Как вас зовут?";

export type Level = "novice" | "practitioner" | "expert";
export type Profile = { name?: string; background?: string; launches?: string; level?: Level; current?: string };

const ONBOARDING: Step[] = ["name", "background", "launches", "level", "current"];
export const isOnboarding = (s: Step) => ONBOARDING.includes(s);

/** Быстрые ответы для шагов, где они уместны */
export const QUICK_REPLIES: Partial<Record<Step, string[]>> = {
  level: ["Ни разу не проводил", "Проводил несколько интервью", "Делаю это регулярно"],
  launches: ["Это мой первый проект", "Запускал, но без продаж", "Были продажи"],
};

export function detectLevel(p: Profile): Level {
  const all = `${p.background ?? ""} ${p.launches ?? ""} ${p.level ?? ""}`.toLowerCase();
  let score = 0;
  if (/(?<!без )продаж|выручк|платящ|окуп|mrr|arr/.test(all)) score += 2;
  if (/регулярно|десятки|много интервью|cusdev|кастдев/.test(all)) score += 2;
  if (/несколько|проводил|запускал/.test(all)) score += 1;
  const years = Number(all.match(/(\d+)\s*(год|лет)/)?.[1] ?? 0);
  if (years >= 5) score += 1;
  if (/первый|ни разу|нет опыта|не проводил/.test(all)) score -= 1;
  return score >= 3 ? "expert" : score >= 1 ? "practitioner" : "novice";
}

const LEVEL_LINE: Record<Level, string> = {
  novice: "Буду объяснять термины по ходу и начну с самого рискованного допущения.",
  practitioner: "Без лекций: сразу к цифрам и рискам.",
  expert: "Говорим на одном языке. Жду от вас фактов, а не ощущений.",
};

type Reply = {
  quick?: string[];
  text: string;
  mood: MascotMood;
  next: Step;
  nodes: CortexNode[];
  unlock?: "product";
};

let seq = 0;
const nid = (p: string) => `${p}-${++seq}`;
const clip = (s: string, n = 42) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/**
 * Один ход диалога = одна транзакция в Кортекс.
 * retried — уже переспрашивали на этом шаге (второй раз не мучаем, пишем допущение).
 */
export function respond(
  step: Step,
  text: string,
  ctx: { type: IdeaType; nodes: CortexNode[]; retried: boolean; profile: Profile },
): Reply & { profile?: Profile } {
  if (isOnboarding(step)) return onboard(step, text, ctx.profile);
  const q = Q[ctx.type];
  const objective = isObjective(text);
  const status: NodeStatus = objective ? "check" : "assume";
  const find = (k: CortexNode["kind"]) => ctx.nodes.filter((n) => n.kind === k).at(-1);

  if (wantsToSkip(text) && step !== "idea" && step !== "done") {
    return {
      text: "Стоп. Код появится после подтверждённой проблемы. Ответьте сначала на вопрос выше.",
      mood: "blocking",
      next: step,
      nodes: [],
    };
  }

  // не объективно → один раз переспрашиваем
  const demandsEvidence = step !== "idea" && step !== "done" && !objective && !ctx.retried;
  if (demandsEvidence) {
    return {
      text: "Это допущение. Назовите число или источник: откуда вы это знаете?",
      mood: "challenging",
      next: step,
      nodes: [],
    };
  }

  switch (step) {
    case "idea": {
      const idea: CortexNode = { id: nid("idea"), nexus: "market", kind: "idea", label: clip(text), status: "assume", links: [] };
      return { text: `Пока это гипотеза, а не продукт. ${q.payer}`, mood: "challenging", next: "payer", nodes: [idea] };
    }
    case "payer": {
      const idea = find("idea");
      const aud: CortexNode = { id: nid("aud"), nexus: "market", kind: "audience", label: clip(text), status, links: idea ? [idea.id] : [] };
      return { text: q.barriers, mood: "challenging", next: "barriers", nodes: [aud] };
    }
    case "barriers": {
      const aud = find("audience");
      const alt: CortexNode = { id: nid("alt"), nexus: "market", kind: "alternative", label: clip(text), status, links: aud ? [aud.id] : [] };
      const pain: CortexNode = { id: nid("pain"), nexus: "market", kind: "pain", label: "Боль: " + clip(text, 34), status, links: [alt.id] };
      return { text: q.economics, mood: "challenging", next: "economics", nodes: [alt, pain] };
    }
    case "economics": {
      const metric: CortexNode = { id: nid("cac"), nexus: "growth", kind: "metric", label: "CAC / LTV: " + clip(text, 30), status, links: [] };
      const all = [...ctx.nodes, metric];
      const market = all.filter((n) => n.kind === "audience" || n.kind === "alternative" || n.kind === "metric");
      const solid = market.filter((n) => n.status !== "assume").length;
      if (solid >= 2) {
        return {
          text: "Рынок описан фактами, а не верой. Открываю Нексус Продукта: какую боль закрывает первая функция?",
          mood: "approving",
          next: "feature",
          nodes: [metric],
          unlock: "product",
        };
      }
      return {
        text: "Пока это набор допущений. В Продукт не пущу, пока нет хотя бы двух цифр или интервью.",
        mood: "blocking",
        next: "payer",
        nodes: [metric],
      };
    }
    case "feature": {
      const pain = find("pain");
      const feature: CortexNode = { id: nid("feat"), nexus: "product", kind: "feature", label: clip(text), status: "assume", links: pain ? [pain.id] : [] };
      return {
        text: "Функция привязана к боли из Рынка. Как вы узнаете, что ей пользуются? Назовите одну метрику.",
        mood: "listening",
        next: "usage",
        nodes: [feature],
      };
    }
    case "usage": {
      const feat = find("feature");
      const m: CortexNode = { id: nid("use"), nexus: "growth", kind: "metric", label: clip(text), status, links: feat ? [feat.id] : [] };
      return {
        text: "Записал. Разработка откроется после пяти проблемных интервью — это метод, а не ограничение демо.",
        mood: "approving",
        next: "done",
        nodes: [m],
      };
    }
    default:
      return {
        text: "Демо-сессия закончена. Полная версия ведёт дальше: интервью, эксперты, лендинг, первые продажи.",
        mood: "listening",
        next: "done",
        nodes: [],
      };
  }
}

/** Наполненность Нексуса объективными данными, 0..1 */
export function nexusFill(nodes: CortexNode[], nx: NexusId) {
  const need: Record<NexusId, number> = { market: 4, product: 2, growth: 2, ops: 3, tech: 3 };
  const score = nodes
    .filter((n) => n.nexus === nx)
    .reduce((s, n) => s + (n.status === "ok" ? 1 : n.status === "check" ? 0.75 : n.status === "assume" ? 0.25 : 0), 0);
  return Math.min(1, score / need[nx]);
}

/** Знакомство: понять уровень знаний, прежде чем спорить об идее */
function onboard(step: Step, text: string, profile: Profile): Reply & { profile: Profile } {
  const p = { ...profile };
  switch (step) {
    case "name": {
      p.name = clip(text.replace(/^(меня зовут|я)\s+/i, "").split(/[,.!]/)[0], 24);
      return { text: `${p.name}, чем вы занимаетесь и сколько лет в этом?`, mood: "listening", next: "background", nodes: [], profile: p };
    }
    case "background":
      p.background = text;
      return {
        text: "Запускали продукты раньше? Что получилось, а что нет?",
        mood: "listening",
        next: "launches",
        nodes: [],
        profile: p,
        quick: QUICK_REPLIES.launches,
      };
    case "launches":
      p.launches = text;
      return {
        text: "Проводили проблемные интервью с клиентами?",
        mood: "listening",
        next: "level",
        nodes: [],
        profile: p,
        quick: QUICK_REPLIES.level,
      };
    case "level": {
      p.level = detectLevel({ ...p, level: undefined, background: `${p.background} ${text}` });
      return { text: "Над чем работаете прямо сейчас, какая задача горит?", mood: "listening", next: "current", nodes: [], profile: p };
    }
    default: {
      p.current = text;
      const lvl = p.level ?? "novice";
      const founder: CortexNode = {
        id: nid("founder"),
        nexus: "ops",
        kind: "audience",
        label: `Фаундер: ${p.name ?? "вы"} · ${{ novice: "новичок", practitioner: "практик", expert: "эксперт" }[lvl]}`,
        status: "ok",
        links: [],
      };
      const task: CortexNode = { id: nid("task"), nexus: "ops", kind: "hypothesis", label: "Текущая задача: " + clip(text, 30), status: "check", links: [founder.id] };
      return {
        text: `${LEVEL_LINE[lvl]} Теперь идея — одной фразой.`,
        mood: "approving",
        next: "idea",
        nodes: [founder, task],
        profile: p,
      };
    }
  }
}
