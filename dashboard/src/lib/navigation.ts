import {
  LayoutDashboard,
  MessagesSquare,
  Briefcase,
  Building2,
  FileText,
  Play,
  ScrollText,
  Ban,
  Settings,
  CalendarClock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Обзор", icon: LayoutDashboard },
  { href: "/negotiations", label: "Отклики", icon: MessagesSquare },
  { href: "/vacancies", label: "Вакансии", icon: Briefcase },
  { href: "/employers", label: "Работодатели", icon: Building2 },
  { href: "/resumes", label: "Резюме", icon: FileText },
  { href: "/operations", label: "Операции", icon: Play },
  { href: "/logs", label: "Логи", icon: ScrollText },
  { href: "/blacklist", label: "Блэклист", icon: Ban },
  { href: "/settings", label: "Настройки", icon: Settings },
  { href: "/schedules", label: "Расписание", icon: CalendarClock },
];
