import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Rocket, MessageCircle, ArrowLeft } from "lucide-react";

export const metadata = { title: "Тарифы — 1.618 worksearch" };

const PLANS = [
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
    href: "/setup",
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
    href: "https://t.me/nsrv_1618",
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
    href: "https://t.me/nsrv_1618",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-12">
      <div className="mb-4">
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          В дашборд
        </a>
      </div>

      <h1 className="text-center text-3xl font-bold tracking-tight">
        Выберите тариф
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Бесплатный старт, оплата за расширенные возможности
      </p>

      <div className="mt-10 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col ${
              plan.popular
                ? "border-primary/30 shadow-[0_8px_40px_rgba(212,175,55,0.1)] md:scale-105"
                : ""
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2" variant="default">
                Популярный
              </Badge>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{plan.desc}</p>
              <div className="mt-3">
                <span className="text-3xl font-bold">
                  {plan.price === "0" ? "Бесплатно" : `${plan.price} ₽`}
                </span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={plan.popular ? "default" : "outline"}
                asChild
              >
                <a
                  href={plan.href}
                  target={plan.href.startsWith("http") ? "_blank" : undefined}
                  rel={plan.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  {plan.href.startsWith("http") ? (
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                  ) : (
                    <Rocket className="mr-1.5 h-4 w-4" />
                  )}
                  {plan.cta}
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Оплата через Telegram. Автоматические платежи появятся скоро.
      </p>
    </div>
  );
}
