"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Please enter your email address."); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong. Please try again."); setLoading(false); return; }
      setLoading(false);
      setSent(true);
    } catch {
      setError("Network error. Please check your connection.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#06071a] px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="blob h-[500px] w-[500px] bg-cyan-500/10 left-[-150px] top-[-100px]" />
        <div className="blob h-[500px] w-[500px] bg-violet-600/10 right-[-150px] bottom-[-100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center leading-none">
            <span className="text-3xl font-bold text-white">
              Aus<span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Drive</span>
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/4 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Check your email</h2>
              <p className="mt-2 text-sm text-white/50">
                We&apos;ve sent a password reset link to <span className="text-white font-medium">{email}</span>
              </p>
              <Link href="/auth/login" className="mt-6 inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </motion.div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white">Reset password</h1>
              <p className="mt-1 text-sm text-white/45">Enter your email and we&apos;ll send you a reset link.</p>

              {error && (
                <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50 uppercase tracking-wide">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition" />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-3 text-sm font-bold text-white shadow-[0_0_24px_rgba(99,102,241,0.4)] transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </span>
                  ) : "Send Reset Link"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
