"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="max-w-md border-destructive/50">
        <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div>
            <h2 className="text-lg font-semibold">Что-то пошло не так</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {error.message || "Произошла неожиданная ошибка"}
            </p>
          </div>
          <Button onClick={reset}>Попробовать снова</Button>
        </CardContent>
      </Card>
    </div>
  );
}
