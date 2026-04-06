"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createBrowserSupabase } from "@/lib/supabase-client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      setError("Пароль должен быть не менее 6 символов");
      return;
    }

    setLoading(true);

    const supabase = createBrowserSupabase();
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // If email confirmation is disabled, redirect to dashboard
      // Otherwise show success message
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push("/");
        router.refresh();
      } else {
        setSuccess(true);
        setLoading(false);
      }
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background bg-grid overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08),transparent_70%)]" />
        <div className="animate-scale-in relative w-full max-w-sm z-10">
          <div className="card-gradient-border rounded-2xl border border-border bg-card/80 p-8 shadow-xl shadow-black/20 backdrop-blur-xl text-center">
            <h2 className="text-lg font-bold mb-2">Проверьте почту</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Мы отправили ссылку для подтверждения на {email}
            </p>
            <Link href="/login" className="text-primary hover:underline text-sm">
              Вернуться ко входу
            </Link>
          </div>
        </div>
      </div>
    );
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
              <p className="mt-1 text-sm text-muted-foreground">Создайте аккаунт</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoFocus
              autoComplete="email"
              className="h-11"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              autoComplete="new-password"
              className="h-11"
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Подтвердите пароль"
              autoComplete="new-password"
              className="h-11"
            />

            {error && (
              <p className="animate-fade-in text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="h-11 w-full bg-primary text-primary-foreground hover:bg-[#F5D061] hover:shadow-[0_8px_40px_rgba(212,175,55,0.3)] transition-all duration-300" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Зарегистрироваться
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
