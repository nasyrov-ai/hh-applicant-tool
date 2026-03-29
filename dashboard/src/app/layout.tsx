import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar, MobileHeader } from "@/components/sidebar";
import "./globals.css";

const CommandPalette = dynamic(() =>
  import("@/components/command-palette").then((m) => m.CommandPalette)
);

export const metadata: Metadata = {
  title: "HH Dashboard",
  description: "Дашборд для hh-applicant-tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            <Sidebar />
            <MobileHeader />
            <main className="min-h-screen p-4 md:ml-56 md:p-6">
              {children}
            </main>
            <CommandPalette />
            <Toaster richColors position="bottom-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
