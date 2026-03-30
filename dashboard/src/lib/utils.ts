import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n);
}

export function formatSalary(from?: number | null, to?: number | null, currency?: string | null): string {
  if (!from && !to) return "—";
  const c = currency || "RUR";
  const sym = c === "RUR" ? "₽" : c === "USD" ? "$" : c === "EUR" ? "€" : c;
  if (from && to) return `${formatNumber(from)} – ${formatNumber(to)} ${sym}`;
  if (from) return `от ${formatNumber(from)} ${sym}`;
  return `до ${formatNumber(to!)} ${sym}`;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function stateLabel(state: string): string {
  const map: Record<string, string> = {
    active: "Активный",
    response: "Отклик",
    interview: "Приглашение",
    invitation: "Приглашение",
    discard: "Отказ",
    sent: "Отправлен",
  };
  // state может содержать подвиды: invitation_interview и тд
  for (const [key, label] of Object.entries(map)) {
    if (state.startsWith(key)) return label;
  }
  return state;
}

export function stateColor(state: string): string {
  if (state === "interview" || state.startsWith("inv")) return "text-success";
  if (state === "discard") return "text-destructive";
  if (state === "active" || state === "response") return "text-accent";
  return "text-muted-foreground";
}

export function experienceLabel(exp: string | null | undefined): string {
  if (!exp) return "—";
  const map: Record<string, string> = {
    noExperience: "Без опыта",
    between1And3: "1–3 года",
    between3And6: "3–6 лет",
    moreThan6: "6+ лет",
  };
  return map[exp] || exp;
}

export function stateBadgeVariant(state: string): "success" | "destructive" | "default" | "warning" | "muted" {
  if (state === "interview") return "success";
  if (state === "discard") return "destructive";
  if (state === "response" || state === "active") return "default";
  return "muted";
}

export function commandStatusVariant(status: string): "success" | "destructive" | "warning" | "muted" | "default" {
  switch (status) {
    case "completed": return "success";
    case "failed": return "destructive";
    case "running": return "warning";
    case "cancelled": return "muted";
    default: return "default";
  }
}

export function commandStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "В очереди",
    running: "Выполняется",
    completed: "Завершено",
    failed: "Ошибка",
    cancelled: "Отменено",
  };
  return map[status] || status;
}
