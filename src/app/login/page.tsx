"use client";

import { useState, FormEvent, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Loader2,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Shield,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn, DEFAULT_BUSINESS_NAME } from "@/lib/utils";

function LoginField({
  id,
  label,
  icon: Icon,
  type,
  autoComplete,
  value,
  onChange,
  autoFocus,
  trailing,
}: {
  id: string;
  label: string;
  icon: typeof User;
  type: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-[11px] font-semibold text-garage-400 uppercase tracking-[0.14em] pl-1"
      >
        {label}
      </label>
      <div className="relative group">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-garage-500 group-focus-within:text-amber-brand transition-colors pointer-events-none" />
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus={autoFocus}
          required
          className={cn(
            "w-full bg-garage-950/60 border border-garage-700/80 rounded-2xl py-3.5 text-white placeholder:text-garage-600",
            "focus:border-amber-brand/60 focus:ring-2 focus:ring-amber-brand/20 transition-all",
            trailing ? "pl-11 pr-12" : "pl-11 pr-4"
          )}
          placeholder={label}
        />
        {trailing}
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Sign in failed.");
        setLoading(false);
        return;
      }

      router.replace(from.startsWith("/") ? from : "/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden login-atmosphere">
      <div className="absolute inset-0 login-grid pointer-events-none" aria-hidden />
      <div
        className="absolute top-[12%] left-1/2 -translate-x-1/2 w-[min(100%,28rem)] h-64 rounded-full bg-amber-brand/10 blur-3xl login-glow-ring pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full bg-amber-brand-dark/10 blur-3xl pointer-events-none"
        aria-hidden
      />

      <div className="relative z-10 min-h-dvh flex flex-col max-w-md mx-auto px-5 safe-top safe-bottom">
        <div className="flex-1 flex flex-col justify-center py-10">
          <header className="text-center mb-10 login-fade-up">
            <div className="relative inline-flex mb-6">
              <div
                className="absolute inset-0 rounded-full bg-amber-brand/25 blur-xl scale-125 login-glow-ring"
                aria-hidden
              />
              <div className="relative w-[5.5rem] h-[5.5rem] rounded-full p-[3px] bg-gradient-to-br from-amber-brand-light via-amber-brand to-amber-brand-dark shadow-2xl shadow-amber-brand/25">
                <div className="w-full h-full rounded-full bg-garage-950 flex items-center justify-center overflow-hidden">
                  {!logoFailed ? (
                    <Image
                      src="/logo.png"
                      alt=""
                      width={80}
                      height={80}
                      className="rounded-full object-cover"
                      priority
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    <Wrench
                      className="w-9 h-9 text-amber-brand"
                      strokeWidth={2.25}
                    />
                  )}
                </div>
              </div>
            </div>

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-brand/80 mb-2">
              Garage Management
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {DEFAULT_BUSINESS_NAME}
            </h1>
            <p className="text-sm text-garage-400 mt-2 max-w-[16rem] mx-auto leading-relaxed">
              Sign in to manage jobs, customers &amp; invoices
            </p>
          </header>

          <div className="login-fade-up-delay-1">
            <div className="rounded-3xl border border-garage-700/70 bg-garage-900/55 backdrop-blur-xl shadow-2xl shadow-black/40 p-6 sm:p-7">
              <form onSubmit={handleSubmit} className="space-y-5">
                <LoginField
                  id="username"
                  label="Username"
                  icon={User}
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={setUsername}
                  autoFocus
                />

                <LoginField
                  id="password"
                  label="Password"
                  icon={Lock}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={setPassword}
                  trailing={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center text-garage-500 hover:text-garage-200 hover:bg-garage-800/80 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  }
                />

                {error && (
                  <div
                    className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300 leading-snug">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  disabled={loading || !username || !password}
                  className="mt-1 rounded-2xl h-14 text-base shadow-xl shadow-amber-brand/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

        <footer className="login-fade-up-delay-2 flex items-center justify-center gap-2 pb-6 text-garage-600">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <p className="text-xs">Authorised access only</p>
        </footer>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-dvh login-atmosphere flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center shadow-lg shadow-amber-brand/30">
          <Loader2 className="w-6 h-6 animate-spin text-garage-950" />
        </div>
        <p className="text-sm text-garage-500">Loading…</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
