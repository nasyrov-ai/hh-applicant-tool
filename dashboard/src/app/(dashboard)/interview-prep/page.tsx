import { createStaticSupabase } from "@/lib/supabase-static";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { GraduationCap, ExternalLink, Sparkles } from "lucide-react";
import { CopyButton } from "./copy-button";
import { experienceLabel } from "@/lib/utils";

export const metadata = { title: "Подготовка к собесу — 1.618 worksearch" };
export const revalidate = 60;

interface NegRow {
  id: string;
  state: string;
  vacancy_id: number;
  employer_id: number | null;
  updated_at: string;
}

interface VacRow {
  id: number;
  name: string;
  experience: string | null;
  salary_from: number | null;
  salary_to: number | null;
  currency: string | null;
  alternate_url: string | null;
}

export default async function InterviewPrepPage() {
  const supabase = createStaticSupabase();

  // Fetch invitation negotiations
  const { data: negs } = await supabase
    .from("negotiations")
    .select("id, state, vacancy_id, employer_id, updated_at")
    .or("state.eq.interview,state.like.invitation%")
    .order("updated_at", { ascending: false })
    .limit(20);

  const negotiations = (negs ?? []) as NegRow[];

  // Fetch vacancy details
  const vacancyIds = [...new Set(negotiations.map((n) => n.vacancy_id))];
  const { data: vacs } = vacancyIds.length > 0
    ? await supabase
        .from("vacancies")
        .select("id, name, experience, salary_from, salary_to, currency, alternate_url")
        .in("id", vacancyIds)
    : { data: [] };

  const vacMap = new Map<number, VacRow>();
  for (const v of (vacs ?? []) as VacRow[]) {
    vacMap.set(v.id, v);
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Подготовка к собесу"
        description="Генерация вопросов для предстоящих собеседований"
      />

      {negotiations.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Нет приглашений"
          description="Когда работодатели пригласят вас на собеседование, здесь появятся инструменты подготовки"
        />
      ) : (
        <div className="space-y-4">
          {negotiations.map((n) => {
            const vac = vacMap.get(n.vacancy_id);
            const vacName = vac?.name ?? `Вакансия #${n.vacancy_id}`;

            const prompt = buildInterviewPrompt(vacName, vac);

            return (
              <Card key={n.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{vacName}</CardTitle>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="success">Приглашение</Badge>
                        {vac?.experience && (
                          <span>{experienceLabel(vac.experience)}</span>
                        )}
                        {vac?.salary_from && (
                          <span>
                            от {vac.salary_from.toLocaleString("ru-RU")} {vac.currency === "RUR" ? "₽" : vac.currency}
                          </span>
                        )}
                      </div>
                    </div>
                    {vac?.alternate_url && (
                      <a
                        href={vac.alternate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Sparkles className="h-3.5 w-3.5" />
                        Промпт для AI
                      </div>
                      <CopyButton text={prompt} />
                    </div>
                    <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/80">
                      {prompt}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function buildInterviewPrompt(vacancyName: string, vac: VacRow | undefined): string {
  let prompt = `Я готовлюсь к собеседованию на позицию "${vacancyName}".`;

  if (vac?.experience) {
    prompt += `\nТребуемый опыт: ${experienceLabel(vac.experience)}.`;
  }

  if (vac?.salary_from || vac?.salary_to) {
    const parts = [];
    if (vac.salary_from) parts.push(`от ${vac.salary_from.toLocaleString("ru-RU")}`);
    if (vac.salary_to) parts.push(`до ${vac.salary_to.toLocaleString("ru-RU")}`);
    prompt += `\nЗарплата: ${parts.join(" ")} ${vac.currency === "RUR" ? "₽" : vac.currency || ""}.`;
  }

  prompt += `

Сгенерируй:
1. 10 наиболее вероятных технических вопросов для этой позиции
2. 5 вопросов о soft skills и мотивации
3. 3 вопроса, которые стоит задать работодателю
4. Краткие рекомендации по подготовке (на что обратить внимание)

Отвечай на русском. Будь конкретен — привязывай вопросы к специфике позиции.`;

  return prompt;
}

