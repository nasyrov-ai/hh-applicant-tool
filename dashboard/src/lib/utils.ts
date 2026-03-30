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

// Single source of truth for negotiation state display config.
// Each entry: prefix to match against state string -> {label, color, badgeVariant}.
const STATE_CONFIG: {
  prefix: string;
  label: string;
  color: string;
  badgeVariant: "success" | "destructive" | "default" | "warning" | "muted";
}[] = [
  { prefix: "interview", label: "Приглашение", color: "text-success", badgeVariant: "success" },
  { prefix: "invitation", label: "Приглашение", color: "text-success", badgeVariant: "success" },
  { prefix: "discard", label: "Отказ", color: "text-destructive", badgeVariant: "destructive" },
  { prefix: "active", label: "Активный", color: "text-accent", badgeVariant: "default" },
  { prefix: "response", label: "Отклик", color: "text-accent", badgeVariant: "default" },
  { prefix: "sent", label: "Отправлен", color: "text-muted-foreground", badgeVariant: "muted" },
];

function findStateConfig(state: string) {
  return STATE_CONFIG.find((c) => state.startsWith(c.prefix));
}

export function stateLabel(state: string): string {
  return findStateConfig(state)?.label ?? state;
}

export function stateColor(state: string): string {
  return findStateConfig(state)?.color ?? "text-muted-foreground";
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
  return findStateConfig(state)?.badgeVariant ?? "muted";
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
