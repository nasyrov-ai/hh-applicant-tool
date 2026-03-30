"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  RefreshCw,
  Trash2,
  Database,
  Key,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";


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
      title="Командная палитра"
      description="Поиск страниц и операций"
      showCloseButton={false}
    >
      <CommandInput placeholder="Поиск..." />
      <CommandList>
        <CommandEmpty>Ничего не найдено</CommandEmpty>
        <CommandGroup heading="Страницы">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
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
