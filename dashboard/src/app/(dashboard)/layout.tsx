import dynamic from "next/dynamic";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar, MobileHeader } from "@/components/sidebar";

const CommandPalette = dynamic(() =>
  import("@/components/command-palette").then((m) => m.CommandPalette)
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar />
      <MobileHeader />
      <main className="min-h-screen p-4 md:ml-56 md:p-6 bg-grid overflow-hidden">
        <div className="glow-gold glow-pulse" style={{ top: "-200px", right: "-100px", opacity: 0.5 }} />
        <div className="relative z-10">
          {children}
        </div>
      </main>
      <CommandPalette />
    </TooltipProvider>
  );
}
