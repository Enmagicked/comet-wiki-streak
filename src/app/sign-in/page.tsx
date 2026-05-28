"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Stars } from "@/components/Stars";

const WIKI_ERRORS: Record<string, string> = {
  wiki_not_configured: "Wikipedia login isn't configured yet.",
  wiki_state: "Wikipedia sign-in expired or was tampered with. Try again.",
  wiki_token: "Couldn't complete the Wikipedia handshake. Try again.",
  wiki_profile: "Couldn't read your Wikipedia profile. Try again.",
  wiki_user: "Couldn't set up your account. Try again.",
  wiki_session: "Couldn't start your session. Try again.",
};

export default function SignIn() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code && WIKI_ERRORS[code]) setErr(WIKI_ERRORS[code]);
  }, []);

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

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-cloud-deep/20" />
          <span className="text-cloud-deep text-xs uppercase tracking-widest font-mono">or</span>
          <div className="h-px flex-1 bg-cloud-deep/20" />
        </div>

        <a
          href="/api/auth/wikipedia/login"
          className="w-full flex items-center justify-center gap-2 border border-cloud-deep/40 rounded-lg py-3 text-star hover:border-cloud hover:bg-night/40 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-star" aria-hidden>
            <path d="M21.6 6.2h-5.1v.6c.7.05 1.2.2 1.4.45.2.25.15.7-.15 1.4l-2.7 6-2.5-5.8c-.3-.7-.35-1.2-.1-1.5.2-.3.7-.45 1.4-.5v-.6H8.1v.6c.5.05.85.2 1.1.45.25.25.5.7.8 1.4l.5 1.1-2 4.4-2.5-5.9c-.3-.7-.3-1.15-.05-1.4.25-.25.65-.4 1.2-.45v-.6H2.4v.6c.45.05.8.2 1.05.5.25.3.55.85.85 1.6l3.6 8.5h.65l2.5-5.4 2.35 5.4h.65l3.7-8.4c.35-.8.7-1.35 1-1.65.3-.3.65-.45 1.05-.5v-.6Z" />
          </svg>
          Continue with Wikipedia
        </a>

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
