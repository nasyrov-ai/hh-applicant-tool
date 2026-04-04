"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available (no HTTPS or permission denied)
    }
  }, [text]);

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="gap-1.5 text-xs">
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-success" />
          Скопировано
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Копировать
        </>
      )}
    </Button>
  );
}
