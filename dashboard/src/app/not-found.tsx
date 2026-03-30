import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <EmptyState
        icon={FileQuestion}
        title="Страница не найдена"
        description="Запрашиваемая страница не существует или была перемещена."
      >
        <Button asChild variant="outline">
          <Link href="/">На главную</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
