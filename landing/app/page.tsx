import {
  Zap,
  Bot,
  MessageSquare,
  RefreshCw,
  LayoutDashboard,
  Server,
  Shield,
  Settings,
  ArrowRight,
  Terminal,
  Database,
  Globe,
} from "lucide-react";
import Image from "next/image";
import { AnimateOnScroll } from "@/components/animate-on-scroll";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

const features = [
  {
    icon: Zap,
    title: "Auto-Apply",
    desc: "Respond to vacancies matching your query with configurable filters and limits.",
  },
  {
    icon: Bot,
    title: "AI Cover Letters",
    desc: "GPT-4o or Claude generates unique cover letters mimicking natural writing.",
  },
  {
    icon: MessageSquare,
    title: "Auto-Reply",
    desc: "Context-aware AI responses to employer messages and invitations.",
  },
  {
    icon: RefreshCw,
    title: "Resume Refresh",
    desc: "Periodic resume updates keep you visible to recruiters.",
  },
  {
    icon: LayoutDashboard,
    title: "Real-Time Dashboard",
    desc: "Monitor applications, control the worker, review negotiations.",
  },
  {
    icon: Server,
    title: "Remote Worker",
    desc: "Headless process on a VPS via Supabase command queue. Runs 24/7.",
  },
  {
    icon: Shield,
    title: "Self-Hosted",
    desc: "Your own Supabase instance. Your data stays yours.",
  },
  {
    icon: Settings,
    title: "Setup Wizard",
    desc: "Interactive CLI configures everything in minutes.",
  },
];

const techStack = [
  { icon: Terminal, label: "CLI", tech: "Python 3.11+, requests, SQLAlchemy" },
  { icon: Bot, label: "AI", tech: "OpenAI GPT-4o, Claude" },
  { icon: LayoutDashboard, label: "Frontend", tech: "Next.js 16, React 19, Tailwind 4, shadcn/ui" },
  { icon: Database, label: "Database", tech: "Supabase (PostgreSQL), SQLite" },
  { icon: Server, label: "Worker", tech: "Python, systemd, Docker" },
  { icon: Globe, label: "Deploy", tech: "Vercel, Docker, systemd" },
];

export default function Page() {
  return (
    <div className="min-h-screen">
      {/* ---- Nav ---- */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <span className="text-sm font-bold tracking-tight">hh-applicant-tool</span>
          <div className="flex items-center gap-5">
            <a href="#features" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">Features</a>
            <a href="#architecture" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">Architecture</a>
            <a href="#stack" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">Stack</a>
            <a
              href="https://github.com/nasyrov-ai/hh-applicant-tool"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-14">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[15%] h-[500px] w-[500px] rounded-full bg-primary/[0.07] blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[10%] right-[10%] h-[400px] w-[400px] rounded-full bg-indigo-500/[0.05] blur-[120px] animate-pulse-slow [animation-delay:3s]" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="hero-enter mb-8 inline-flex items-center gap-2.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Open Source &middot; Self-Hosted &middot; MIT
          </div>

          {/* Headline */}
          <h1 className="hero-enter-d1 text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Automate your<br />
            <span className="gradient-text">job applications</span>
          </h1>

          {/* Sub */}
          <p className="hero-enter-d2 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            AI-powered engine for hh.ru — sends applications with unique cover letters, replies to employers, and tracks everything in a real-time dashboard.
          </p>

          {/* CTA */}
          <div className="hero-enter-d3 mt-10 flex items-center justify-center gap-3">
            <a
              href="https://github.com/nasyrov-ai/hh-applicant-tool"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#features"
              className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Screenshot */}
        <div className="hero-enter-img relative z-10 mx-auto mt-20 w-full max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <Image
              src="/screenshots/overview-dark.png"
              alt="Dashboard Overview"
              width={1440}
              height={900}
              className="block"
              priority
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="h-24" />
      </section>

      {/* ---- Features ---- */}
      <section id="features" className="border-t border-border bg-accent/50 px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <AnimateOnScroll className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need</h2>
            <p className="mt-3 text-muted-foreground">From auto-applying to tracking results — one tool handles the entire pipeline.</p>
          </AnimateOnScroll>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <AnimateOnScroll key={f.title} delay={i * 50}>
                <div className="h-full rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                  <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Screenshots ---- */}
      <section className="px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <AnimateOnScroll className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard in action</h2>
            <p className="mt-3 text-muted-foreground">Monitor, control, and analyze — dark &amp; light modes included.</p>
          </AnimateOnScroll>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {[
              { src: "/screenshots/operations-dark.png", label: "Operations — Command Center" },
              { src: "/screenshots/negotiations-dark.png", label: "Negotiations — Application Tracking" },
              { src: "/screenshots/logs-dark.png", label: "Logs — Real-Time Execution" },
              { src: "/screenshots/vacancies-dark.png", label: "Vacancies — Search Results" },
            ].map((s, i) => (
              <AnimateOnScroll key={s.label} delay={i * 80}>
                <div className="overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-xl hover:shadow-primary/5">
                  <Image src={s.src} alt={s.label} width={1440} height={900} className="block" />
                </div>
                <p className="mt-2.5 text-center text-sm text-muted-foreground">{s.label}</p>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Architecture ---- */}
      <section id="architecture" className="border-t border-border bg-accent/50 px-6 py-28">
        <div className="mx-auto max-w-4xl">
          <AnimateOnScroll className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Architecture</h2>
            <p className="mt-3 text-muted-foreground">Three components, one database. Each user owns their data.</p>
          </AnimateOnScroll>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              { icon: LayoutDashboard, color: "text-blue-400 bg-blue-500/10", dot: "bg-blue-400", title: "Dashboard", sub: "Vercel", items: ["Next.js 16 + React 19", "shadcn/ui + Tailwind 4", "Command palette (Cmd+K)", "Real-time status sync"] },
              { icon: Database, color: "text-emerald-400 bg-emerald-500/10", dot: "bg-emerald-400", title: "Supabase", sub: "PostgreSQL", items: ["Command queue", "Application data", "Real-time subscriptions", "Row-level security"] },
              { icon: Server, color: "text-orange-400 bg-orange-500/10", dot: "bg-orange-400", title: "Worker", sub: "VPS / Docker", items: ["Python CLI process", "Polls command queue", "Calls hh.ru API", "AI cover letter generation"] },
            ].map((c, i) => (
              <AnimateOnScroll key={c.title} delay={i * 80}>
                <div className="h-full rounded-xl border border-border bg-card p-6">
                  <div className={`mb-4 inline-flex rounded-lg p-2.5 ${c.color}`}>
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold">{c.title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{c.sub}</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {c.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          <AnimateOnScroll delay={250}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="rounded-md bg-blue-500/10 px-3 py-1 font-medium text-blue-400">Dashboard</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="rounded-md bg-emerald-500/10 px-3 py-1 font-medium text-emerald-400">Supabase</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="rounded-md bg-orange-500/10 px-3 py-1 font-medium text-orange-400">Worker</span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <span className="rounded-md bg-muted px-3 py-1 font-medium text-muted-foreground">hh.ru API</span>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ---- Tech Stack ---- */}
      <section id="stack" className="px-6 py-28">
        <div className="mx-auto max-w-4xl">
          <AnimateOnScroll className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tech Stack</h2>
            <p className="mt-3 text-muted-foreground">Modern tools, production-grade architecture.</p>
          </AnimateOnScroll>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {techStack.map((t, i) => (
              <AnimateOnScroll key={t.label} delay={i * 50}>
                <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40">
                  <div className="mb-3 flex items-center gap-2">
                    <t.icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">{t.label}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-card-foreground/80">{t.tech}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="border-t border-border bg-accent/50 px-6 py-28">
        <AnimateOnScroll className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to automate?</h2>
          <p className="mt-3 text-muted-foreground">Clone the repo, run the setup wizard, and start applying in minutes.</p>

          <div className="mt-8">
            <a
              href="https://github.com/nasyrov-ai/hh-applicant-tool"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110"
            >
              <GithubIcon className="h-4 w-4" />
              View on GitHub
            </a>
          </div>

          {/* Terminal */}
          <div className="mx-auto mt-10 max-w-lg overflow-hidden rounded-xl border border-border bg-[oklch(0.08_0.005_260)] text-left">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-auto font-mono text-xs text-muted-foreground/50">terminal</span>
            </div>
            <pre className="p-5 font-mono text-sm leading-7"><span className="text-primary">$</span> <span className="text-foreground/80">git clone https://github.com/nasyrov-ai/hh-applicant-tool.git</span>{"\n"}<span className="text-primary">$</span> <span className="text-foreground/80">cd hh-applicant-tool</span>{"\n"}<span className="text-primary">$</span> <span className="text-foreground/80">pip install -e .</span>{"\n"}<span className="text-primary">$</span> <span className="text-foreground/80">hh-applicant-tool setup</span></pre>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-sm text-muted-foreground">
          <span>hh-applicant-tool</span>
          <div className="flex items-center gap-4">
            <a href="https://github.com/nasyrov-ai/hh-applicant-tool" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">GitHub</a>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
