"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Menu, LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";
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
import { createBrowserSupabase } from "@/lib/supabase-client";


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
              "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300",
              active
                ? "bg-primary/8 text-primary"
                : "text-sidebar-foreground hover:bg-white/[0.03] hover:text-foreground"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/4 h-1/2 w-0.5 rounded-full bg-primary shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
            )}
            <Icon className={cn(
              "h-4 w-4 shrink-0 transition-all duration-300 group-hover:scale-110",
              active && "text-primary"
            )} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

// StatusIndicators lazy-loaded: defers Supabase client + realtime subscriptions
// until after initial paint, keeping the sidebar shell interactive immediately.
const LazyStatusIndicators = lazy(() =>
  import("@/components/status-indicators").then((m) => ({
    default: m.StatusIndicators,
  }))
);

function StatusIndicatorsFallback() {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-muted-foreground" />
        <span className="text-xs font-medium text-sidebar-foreground">Worker</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-muted-foreground" />
        <span className="text-xs font-medium text-sidebar-foreground">Claude</span>
      </div>
    </div>
  );
}

function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      onClick={handleLogout}
      title="Выйти"
    >
      <LogOut className="h-4 w-4" />
    </Button>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-3 px-4">
        <Image src="/logo-icon.png" alt="1.618 WorkSearch" width={28} height={28} className="rounded-lg shadow-[0_0_12px_rgba(212,175,55,0.2)]" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-gradient-gold text-base font-extrabold tracking-tight">1.618</span>
          <span className="text-sm font-medium text-foreground/70">WorkSearch</span>
        </div>
      </div>
      <Separator className="bg-sidebar-border" />
      <NavLinks onNavigate={onNavigate} />
      <Separator className="bg-sidebar-border" />
      <div className="flex items-center justify-between px-4 py-3">
        <Suspense fallback={<StatusIndicatorsFallback />}>
          <LazyStatusIndicators />
        </Suspense>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on navigation
  useEffect(() => {
    const close = () => setOpen(false);
    close();
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-white/[0.04] bg-card/80 px-4 backdrop-blur-xl md:hidden">
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
        <Image src="/logo-icon.png" alt="1.618" width={24} height={24} className="rounded-md" />
        <span className="font-semibold tracking-tight text-sm">
          <span className="text-gradient-gold">1.618</span>
          <span className="text-muted-foreground ml-1.5 font-normal">worksearch</span>
        </span>
      </div>
    </header>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 border-r border-white/[0.04] bg-sidebar md:flex">
      <SidebarContent />
    </aside>
  );
}
