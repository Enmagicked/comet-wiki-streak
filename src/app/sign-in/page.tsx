"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Stars } from "@/components/Stars";

export default function SignIn() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) { setErr(error.message); return; }
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // sign up
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined },
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }

    // If email confirmation is required, Supabase returns a user but no session.
    if (data.user && !data.session) {
      setEmailSent(true);
      return;
    }
    // Otherwise we're signed in immediately.
    router.push("/dashboard");
    router.refresh();
  }

  if (emailSent) {
    return (
      <main className="relative flex-1 min-h-screen flex items-center justify-center px-6">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-midnight)_0%,_var(--color-night)_70%)]" />
          <Stars density={140} />
        </div>
        <div className="w-full max-w-sm rounded-2xl border border-cloud-deep/30 bg-midnight/60 backdrop-blur-md p-8 text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h1 className="font-display text-2xl mb-3">Check your inbox.</h1>
          <p className="text-cloud text-sm mb-6">
            We sent a verification link to <span className="text-star">{email}</span>.
            Click it to confirm your account, then sign in. (Check spam if it&apos;s not there in a minute.)
          </p>
          <button
            onClick={() => { setEmailSent(false); setMode("in"); }}
            className="text-sm text-cloud-deep hover:text-cloud transition-colors"
          >
            ← back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex-1 min-h-screen flex items-center justify-center px-6">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-midnight)_0%,_var(--color-night)_70%)]" />
        <Stars density={140} />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-cloud-deep/30 bg-midnight/60 backdrop-blur-md p-8">
        <Link href="/" className="block text-cloud-deep text-xs uppercase tracking-widest font-mono mb-6">← comet</Link>
        <h1 className="font-display text-3xl mb-2">{mode === "in" ? "Welcome back." : "Begin your streak."}</h1>
        <p className="text-cloud text-sm mb-6">{mode === "in" ? "Sign in to keep the streak alive." : "Five minutes a day, drifting through everything humans know."}</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@somewhere.edu"
            className="w-full bg-night/60 border border-cloud-deep/30 rounded-lg px-4 py-3 text-star placeholder:text-cloud-deep focus:border-link outline-none"
          />
          <input
            type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="w-full bg-night/60 border border-cloud-deep/30 rounded-lg px-4 py-3 text-star placeholder:text-cloud-deep focus:border-link outline-none"
          />
          {err && <div className="text-sm text-red-300">{err}</div>}
          <button
            type="submit" disabled={loading}
            className="w-full bg-star text-night font-medium rounded-lg py-3 hover:bg-moon transition-colors disabled:opacity-50"
          >
            {loading ? "…" : mode === "in" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => setMode((m) => (m === "in" ? "up" : "in"))}
          className="mt-6 text-sm text-cloud-deep hover:text-cloud transition-colors w-full text-center"
        >
          {mode === "in" ? "No account yet? Sign up →" : "Already have one? Sign in →"}
        </button>
      </div>
    </main>
  );
}
