"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Command } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { createBrowserSupabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";


function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-2">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                : "text-sidebar-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
              active && "text-primary"
            )} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function WorkerIndicator() {
  const [status, setStatus] = useState<"online" | "offline" | "unknown">("unknown");

  useEffect(() => {
    const supabase = createBrowserSupabase();

    supabase
      .from("worker_status")
      .select("status, last_seen_at")
      .order("last_seen_at", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }: { data: { status: string; last_seen_at: string } | null }) => {
        if (!data) {
          setStatus("unknown");
          return;
        }
        const lastSeen = new Date(data.last_seen_at);
        const stale = Date.now() - lastSeen.getTime() > 60_000;
        setStatus(stale ? "offline" : (data.status as "online" | "offline"));
      });

    const channel = supabase
      .channel("worker-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "worker_status" },
        (payload: { new: { status: string; last_seen_at: string } }) => {
          const row = payload.new;
          if (row?.status) setStatus(row.status as "online" | "offline");
        }
      )
      .subscribe((status: string) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setStatus("unknown");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const color =
    status === "online"
      ? "bg-success shadow-success/40 shadow-sm"
      : status === "offline"
        ? "bg-destructive"
        : "bg-muted-foreground";

  const label =
    status === "online"
      ? "Воркер онлайн"
      : status === "offline"
        ? "Воркер офлайн"
        : "Воркер —";

  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "h-2 w-2 rounded-full transition-all",
          color,
          status === "online" && "animate-pulse"
        )}
      />
      <span className="text-xs font-medium text-sidebar-foreground">{label}</span>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Command className="h-3.5 w-3.5" />
        </div>
        <span className="font-semibold tracking-tight">
          HH Dashboard
        </span>
      </div>
      <Separator className="bg-sidebar-border" />
      <NavLinks onNavigate={onNavigate} />
      <Separator className="bg-sidebar-border" />
      <div className="flex items-center justify-between px-4 py-3">
        <WorkerIndicator />
        <ThemeToggle />
      </div>
    </div>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-xl md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Открыть навигацию</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-56 bg-sidebar p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Навигация</SheetTitle>
          </SheetHeader>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Command className="h-3.5 w-3.5" />
        </div>
        <span className="font-semibold tracking-tight">
          HH Dashboard
        </span>
      </div>
    </header>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 border-r border-sidebar-border bg-sidebar md:flex">
      <SidebarContent />
    </aside>
  );
}
