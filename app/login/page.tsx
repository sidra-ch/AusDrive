"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

type GoogleCredentialResponse = {
  credential?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; shape?: string; text?: string; width?: number },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function UserLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const googleClientId = useMemo(
    () => process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
    [],
  );

  async function completeLogin(provider: "password" | "google", payload: Record<string, unknown>) {
    const endpoint = provider === "google" ? "/api/auth/google" : "/api/auth/login";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await res.text();
    let data: { error?: string; user?: { role?: string } } | null = null;
    try {
      data = raw ? (JSON.parse(raw) as { error?: string; user?: { role?: string } }) : null;
    } catch {
      data = null;
    }

    if (!res.ok) {
      throw new Error(data?.error ?? "Login failed");
    }

    window.dispatchEvent(new Event("auth:changed"));

    const isAdmin = ["ADMIN", "STAFF", "SUPER_ADMIN"].includes(String(data?.user?.role ?? ""));
    router.push(isAdmin ? "/dashboard" : "/");
    router.refresh();
  }

  useEffect(() => {
    if (!googleClientId) return;

    const existing = document.querySelector<HTMLScriptElement>('script[data-google-identity="1"]');
    const setupGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
          if (!response.credential) {
            setError("Google login failed. Missing ID token.");
            return;
          }

          setGoogleLoading(true);
          setError("");
          try {
            await completeLogin("google", { idToken: response.credential });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Google login failed");
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      const buttonContainer = document.getElementById("google-signin-btn");
      if (buttonContainer) {
        buttonContainer.innerHTML = "";
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: 320,
        });
      }
    };

    if (existing) {
      setupGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "1";
    script.onload = setupGoogle;
    document.head.appendChild(script);
  }, [googleClientId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.email || !form.password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      await completeLogin("password", form);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-foreground">Welcome Back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with your account or continue with Google.</p>

        {error && <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>}

        <div className="mt-5 flex flex-col items-center gap-2">
          <div id="google-signin-btn" className="min-h-[44px]" />
          {!googleClientId && (
            <p className="text-xs text-amber-300">Google login is disabled. Set NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env.local.</p>
          )}
          {googleLoading && <p className="text-xs text-muted-foreground">Signing in with Google...</p>}
        </div>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-xl border border-input bg-background py-3 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-3 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Admin? <Link href="/admin/login" className="text-cyan-400 hover:text-cyan-300">Admin login</Link>
        </p>
      </div>
    </div>
  );
}
