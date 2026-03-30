"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setLoading(true);

    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-grid overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08),transparent_70%)]" />
      <div className="glow-gold glow-pulse" style={{ top: "-20%", left: "50%", transform: "translateX(-50%)" }} />
      <div className="animate-scale-in relative w-full max-w-sm z-10">
        <div className="card-gradient-border rounded-2xl border border-border bg-card/80 p-8 shadow-xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center gap-3">
            <Image src="/logo.svg" alt="1.618" width={40} height={40} className="invert opacity-80" />
            <div className="text-center">
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-gradient-gold">1.618</span>
                <span className="text-muted-foreground ml-2 font-normal text-base">worksearch</span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">Введите пароль для входа</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              autoFocus
              className="h-11"
            />

            {error && (
              <p className="animate-fade-in text-sm text-destructive">Неверный пароль</p>
            )}

            <Button type="submit" className="h-11 w-full bg-primary text-primary-foreground hover:bg-[#F5D061] hover:shadow-[0_8px_40px_rgba(212,175,55,0.3)] transition-all duration-300" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Войти
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
