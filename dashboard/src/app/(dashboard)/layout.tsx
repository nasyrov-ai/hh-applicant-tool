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
      <main className="min-h-screen p-4 md:ml-56 md:p-6">
        {children}
      </main>
      <CommandPalette />
    </TooltipProvider>
  );
}
