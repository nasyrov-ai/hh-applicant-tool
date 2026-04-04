import { Card, CardContent } from "@/components/ui/card";

export function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex h-40 items-center justify-center">
        <p className="text-sm text-destructive">{message}</p>
      </CardContent>
    </Card>
  );
}
