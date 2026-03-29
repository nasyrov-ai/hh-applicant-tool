"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  Send,
  RefreshCw,
  Trash2,
  Database,
  Key,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

const PAGES = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
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

const QUICK_ACTIONS = [
  { id: "apply", label: "Рассылка откликов", icon: Send, href: "/operations" },
  { id: "resumes", label: "Обновить резюме", icon: RefreshCw, href: "/operations" },
  { id: "clear", label: "Очистить отказы", icon: Trash2, href: "/operations" },
  { id: "sync", label: "Синхронизация БД", icon: Database, href: "/operations" },
  { id: "token", label: "Обновить токен", icon: Key, href: "/operations" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const runCommand = useCallback(
    (command: () => void) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Command Palette"
      description="Поиск страниц и операций"
      showCloseButton={false}
    >
      <CommandInput placeholder="Поиск..." />
      <CommandList>
        <CommandEmpty>Ничего не найдено</CommandEmpty>
        <CommandGroup heading="Страницы">
          {PAGES.map(({ href, label, icon: Icon }) => (
            <CommandItem
              key={href}
              onSelect={() => runCommand(() => router.push(href))}
            >
              <Icon />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Быстрые действия">
          {QUICK_ACTIONS.map(({ id, label, icon: Icon, href }) => (
            <CommandItem
              key={id}
              onSelect={() => runCommand(() => router.push(href))}
            >
              <Icon />
              <span>{label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
