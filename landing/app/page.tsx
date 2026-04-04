import {
  Zap,
  Bot,
  MessageSquare,
  RefreshCw,
  LayoutDashboard,

  Shield,
  Settings,
  ArrowRight,
  Check,
  Sparkles,
  Clock,
  Eye,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import ClientEffects from "@/components/client-effects";
import Navbar from "@/components/navbar";
import { SectionReveal } from "@/components/section-reveal";

/* ---- Data ---- */

const features = [
  {
    icon: Zap,
    title: "Авто-отклики",
    desc: "Откликается на вакансии по вашим запросам с настраиваемыми фильтрами. Работает 24/7.",
    accent: "gold",
  },
  {
    icon: Bot,
    title: "AI-сопроводительные",
    desc: "GPT-4o или Claude пишут уникальные письма под каждую вакансию, мимикрируя под человека.",
    accent: "gold",
  },
  {
    icon: MessageSquare,
    title: "Авто-ответы",
    desc: "AI отвечает на сообщения и приглашения работодателей с учётом контекста.",
    accent: "emerald",
  },
  {
    icon: RefreshCw,
    title: "Обновление резюме",
    desc: "Автоматически поднимает резюме, чтобы вы были видны рекрутерам.",
    accent: "gold",
  },
  {
    icon: LayoutDashboard,
    title: "Дашборд",
    desc: "Мониторинг откликов, управление воркером, аналитика — всё в реальном времени.",
    accent: "emerald",
  },
  {
    icon: Eye,
    title: "Полный контроль",
    desc: "Чёрный список компаний, фильтры вакансий, расписание работы — вы решаете всё.",
    accent: "gold",
  },
  {
    icon: Shield,
    title: "Ваши данные",
    desc: "Ваш аккаунт Supabase, ваш воркер. Мы не храним ваши данные.",
    accent: "emerald",
  },
  {
    icon: Clock,
    title: "Запуск за 5 минут",
    desc: "Setup Wizard проведёт через настройку. Никакого DevOps не нужно.",
    accent: "gold",
  },
];

const screenshots = [
  { src: "/screenshots/operations-dark.png", label: "Центр управления" },
  { src: "/screenshots/negotiations-dark.png", label: "Отклики и переговоры" },
  { src: "/screenshots/logs-dark.png", label: "Логи в реальном времени" },
  { src: "/screenshots/vacancies-dark.png", label: "Поиск вакансий" },
];

const plans = [
  {
    name: "Starter",
    price: "0",
    period: "",
    desc: "Для тех, кто хочет попробовать",
    features: [
      "До 20 откликов в день",
      "1 поисковый запрос",
      "Базовый дашборд",
      "Community поддержка",
    ],
    cta: "Начать бесплатно",
    popular: false,
  },
  {
    name: "Pro",
    price: "1 490",
    period: "/мес",
    desc: "Полный автопилот поиска работы",
    features: [
      "Безлимитные отклики",
      "До 10 поисковых запросов",
      "AI-сопроводительные (GPT-4o)",
      "Авто-ответы работодателям",
      "Приоритетная поддержка",
      "Telegram-уведомления",
    ],
    cta: "Подключить Pro",
    popular: true,
  },
  {
    name: "Business",
    price: "4 990",
    period: "/мес",
    desc: "Для рекрутеров и агентств",
    features: [
      "Всё из Pro",
      "До 5 аккаунтов hh.ru",
      "Claude для сопроводительных",
      "API доступ",
      "Выделенный воркер",
      "Персональный онбординг",
    ],
    cta: "Связаться",
    popular: false,
  },
];

const stats = [
  { value: "10,000+", label: "откликов отправлено" },
  { value: "95%", label: "уникальных писем" },
  { value: "24/7", label: "работает без перерыва" },
  { value: "5 мин", label: "до первого отклика" },
];

/* ---- Page ---- */

export default function Page() {
  return (
    <div className="relative min-h-screen">
      <ClientEffects />
      <Navbar />

      {/* ---- Hero ---- */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-16">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden hidden sm:block">
          <div className="absolute left-[15%] top-[15%] h-[500px] w-[500px] rounded-full bg-gold/[0.06] blur-[100px] animate-glow-pulse" />
          <div className="absolute bottom-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-emerald/[0.04] blur-[100px] animate-glow-pulse [animation-delay:3s]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="hero-enter mb-8 inline-flex items-center gap-2.5 rounded-full border border-gold-border bg-bg-surface/80 px-5 py-2 text-sm text-text-body backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-gold" />
            AI-автопилот для hh.ru
          </div>

          {/* Headline */}
          <h1 className="hero-enter-d1 text-[clamp(2.5rem,7vw,5.5rem)] font-[900] leading-[0.95] tracking-tight text-text-heading">
            Поиск работы
            <br />
            на{" "}
            <span className="text-shimmer-gold italic">автопилоте</span>
          </h1>

          {/* Sub */}
          <p className="hero-enter-d2 mx-auto mt-8 max-w-2xl text-[clamp(1rem,2vw,1.25rem)] leading-relaxed text-text-body">
            AI откликается на вакансии, пишет уникальные сопроводительные
            и отвечает работодателям — пока вы занимаетесь подготовкой
            к собеседованиям.
          </p>

          {/* Stats */}
          <div className="hero-enter-d2 mx-auto mt-10 flex max-w-xl flex-wrap items-center justify-center gap-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold text-text-heading">
                  {s.value}
                </div>
                <div className="mt-1 text-xs text-text-muted">{s.label}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="hero-enter-d3 mt-12 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://worksearch.1618.digital/setup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gold px-8 py-4 text-base font-bold text-bg-deep shadow-[0_4px_30px_rgba(212,175,55,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_50px_rgba(212,175,55,0.35)]"
            >
              Попробовать бесплатно
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#features"
              className="rounded-xl border border-gold-border px-8 py-4 text-base font-semibold text-text-heading transition-all hover:border-gold/40 hover:bg-gold-glow"
            >
              Как это работает
            </a>
          </div>
        </div>

        {/* Hero screenshot */}
        <div className="hero-enter-img relative z-10 mx-auto mt-20 w-full max-w-5xl">
          <div className="gradient-border-card overflow-hidden shadow-2xl shadow-gold/[0.05]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-bg-elevated px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-auto font-mono text-xs text-text-dim">
                worksearch.1618.digital
              </span>
            </div>
            <Image
              src="/screenshots/overview-dark.png"
              alt="WorkSearch Dashboard"
              width={1440}
              height={900}
              className="block"
              priority
            />
          </div>
          {/* Glow behind */}
          <div className="pointer-events-none absolute inset-0 -z-10 scale-[1.1] rounded-3xl bg-gold/[0.04] blur-[60px]" />
        </div>

        <div className="h-32" />
      </section>

      {/* ---- Features ---- */}
      <section id="features" className="relative z-10 px-6 py-28">
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-6xl">
          <SectionReveal className="text-center">
            <h2 className="text-[clamp(2rem,5vw,3rem)] font-[900] tracking-tight text-text-heading">
              Всё что нужно для{" "}
              <span className="text-gradient-gold">автопоиска</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-body">
              От автоматических откликов до полного контроля — один инструмент
              закрывает весь цикл поиска работы.
            </p>
          </SectionReveal>

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <SectionReveal key={f.title} delay={i * 60}>
                <div className="gradient-border-card group h-full p-6 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-gold/[0.05]">
                  <div
                    className={`mb-4 inline-flex rounded-xl p-2.5 ${
                      f.accent === "gold"
                        ? "bg-gold-glow text-gold"
                        : "bg-emerald-glow text-emerald"
                    }`}
                  >
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-base font-bold text-text-heading">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-muted">
                    {f.desc}
                  </p>
                  <ChevronRight className="mt-4 h-4 w-4 text-text-dim transition-all group-hover:translate-x-1 group-hover:text-gold" />
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ---- Dashboard ---- */}
      <section id="dashboard" className="relative z-10 px-6 py-28">
        <div className="mx-auto max-w-6xl">
          <SectionReveal className="text-center">
            <h2 className="text-[clamp(2rem,5vw,3rem)] font-[900] tracking-tight text-text-heading">
              Дашборд{" "}
              <span className="text-gradient-gold">реального времени</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-body">
              Управляйте поиском работы из единого центра. Всё прозрачно,
              всё под контролем.
            </p>
          </SectionReveal>

          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {screenshots.map((s, i) => (
              <SectionReveal key={s.label} delay={i * 80}>
                <div className="gradient-border-card group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-gold/[0.05]">
                  <Image
                    src={s.src}
                    alt={s.label}
                    width={1440}
                    height={900}
                    loading="lazy"
                    className="block transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
                <p className="mt-3 text-center text-sm font-medium text-text-muted">
                  {s.label}
                </p>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ---- How it works ---- */}
      <section className="relative z-10 px-6 py-28">
        <div className="pointer-events-none absolute inset-0 bg-grid" />
        <div className="relative mx-auto max-w-4xl">
          <SectionReveal className="text-center">
            <h2 className="text-[clamp(2rem,5vw,3rem)] font-[900] tracking-tight text-text-heading">
              Как это{" "}
              <span className="text-gradient-gold">работает</span>
            </h2>
          </SectionReveal>

          <div className="mt-16 space-y-0">
            {[
              {
                step: "01",
                title: "Подключите аккаунт",
                desc: "Укажите cookie от hh.ru и выберите резюме. Setup Wizard настроит всё за 5 минут.",
                icon: Settings,
              },
              {
                step: "02",
                title: "Настройте автопоиск",
                desc: "Задайте поисковые запросы, фильтры по городу и зарплате, чёрный список компаний.",
                icon: TrendingUp,
              },
              {
                step: "03",
                title: "AI работает за вас",
                desc: "Воркер откликается на вакансии 24/7, пишет уникальные сопроводительные и отвечает работодателям.",
                icon: Bot,
              },
              {
                step: "04",
                title: "Отслеживайте в дашборде",
                desc: "Мониторьте отклики, переговоры и приглашения в реальном времени. Получайте уведомления в Telegram.",
                icon: LayoutDashboard,
              },
            ].map((s, i) => (
              <SectionReveal key={s.step} delay={i * 100}>
                <div className="group flex items-start gap-6 border-l border-gold-border py-10 pl-8 transition-colors hover:border-gold/60">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-glow text-gold font-mono text-sm font-bold">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-heading">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-text-body">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ---- Pricing ---- */}
      <section id="pricing" className="relative z-10 px-6 py-28">
        <div className="mx-auto max-w-5xl">
          <SectionReveal className="text-center">
            <h2 className="text-[clamp(2rem,5vw,3rem)] font-[900] tracking-tight text-text-heading">
              Простые{" "}
              <span className="text-gradient-gold">тарифы</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-text-body">
              Начните бесплатно, перейдите на Pro когда будете готовы.
              Отмена в любой момент.
            </p>
          </SectionReveal>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {plans.map((plan, i) => (
              <SectionReveal key={plan.name} delay={i * 80}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border p-8 ${
                    plan.popular
                      ? "border-gold/30 bg-bg-surface pricing-popular mt-4 md:mt-0 md:scale-105"
                      : "border-white/[0.08] bg-bg-surface"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gold px-5 py-1.5 text-xs font-bold text-bg-deep shadow-[0_4px_20px_rgba(212,175,55,0.3)]">
                      Популярный
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-text-heading">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">{plan.desc}</p>
                  </div>
                  <div className="mb-6">
                    <span className="text-4xl font-[900] text-text-heading">
                      {plan.price === "0" ? "Бесплатно" : `${plan.price} ₽`}
                    </span>
                    {plan.period && (
                      <span className="text-sm text-text-muted">
                        {plan.period}
                      </span>
                    )}
                  </div>
                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-sm text-text-body"
                      >
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            plan.popular ? "text-gold" : "text-emerald"
                          }`}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={
                      plan.name === "Business"
                        ? "https://t.me/nsrv_1618"
                        : "https://worksearch.1618.digital/setup"
                    }
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                      plan.popular
                        ? "bg-gold text-bg-deep shadow-[0_4px_30px_rgba(212,175,55,0.25)] hover:shadow-[0_8px_50px_rgba(212,175,55,0.35)]"
                        : "border border-gold-border text-text-heading hover:border-gold/40 hover:bg-gold-glow"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* ---- Final CTA ---- */}
      <section className="relative z-10 px-6 py-28">
        <SectionReveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-[clamp(2rem,5vw,3rem)] font-[900] tracking-tight text-text-heading">
            Пока вы читаете,
            <br />
            <span className="text-shimmer-gold italic">
              кто-то уже получает офферы
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-lg text-text-body">
            Подключите WorkSearch и начните получать приглашения
            на собеседования уже сегодня.
          </p>
          <div className="mt-10">
            <a
              href="https://worksearch.1618.digital/setup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gold px-10 py-4 text-base font-bold text-bg-deep shadow-[0_4px_30px_rgba(212,175,55,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_50px_rgba(212,175,55,0.35)]"
            >
              Начать бесплатно
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </SectionReveal>
      </section>

      {/* ---- Footer ---- */}
      <footer className="relative z-10 border-t border-white/[0.06] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-gradient-gold text-lg font-extrabold">
                  1.618
                </span>
                <span className="text-sm font-semibold text-text-heading">
                  WorkSearch
                </span>
              </div>
              <p className="mt-2 text-sm text-text-muted">
                AI-автопилот для поиска работы на hh.ru
              </p>
            </div>

            <div className="flex items-center gap-6 text-sm text-text-muted">
              <a
                href="#features"
                className="transition-colors hover:text-text-heading"
              >
                Возможности
              </a>
              <a
                href="#dashboard"
                className="transition-colors hover:text-text-heading"
              >
                Дашборд
              </a>
              <a
                href="#pricing"
                className="transition-colors hover:text-text-heading"
              >
                Тарифы
              </a>
              <a
                href="https://t.me/nsrv_1618"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-gold"
              >
                Telegram
              </a>
            </div>
          </div>

          <div className="mt-10 border-t border-white/[0.04] pt-6 text-center text-xs text-text-dim">
            &copy; 2026 Рустам Насыров &mdash; 1.618
          </div>
        </div>
      </footer>
    </div>
  );
}
