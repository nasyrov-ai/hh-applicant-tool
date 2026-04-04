import { SetupWizard } from "./setup-wizard";

export const metadata = { title: "Настройка — 1.618 worksearch" };

export default function SetupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-primary">1.618</span> worksearch
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Настройка за 5 минут
          </p>
        </div>
        <SetupWizard />
      </div>
    </div>
  );
}
