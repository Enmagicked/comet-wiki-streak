"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Settings() {
  const supabase = createClient();
  const [goal, setGoal] = useState(5);
  const [tz, setTz] = useState("UTC");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("daily_goal_min, timezone, display_name").eq("id", user.id).single();
      if (data) {
        setGoal(data.daily_goal_min ?? 5);
        setTz(data.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
        setName(data.display_name ?? "");
      } else {
        setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
      }
      setLoading(false);
    })();
  }, [supabase]);

  const [err, setErr] = useState<string | null>(null);
  async function save() {
    setSaved(false); setErr(null);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErr("Not signed in."); return; }
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, daily_goal_min: goal, timezone: tz, display_name: name }, { onConflict: "id" });
    if (error) { setErr(error.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <main className="max-w-2xl mx-auto px-6 py-12 text-cloud-deep">Loading…</main>;

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono">settings</div>
      <h1 className="font-display text-4xl mt-1 mb-8">Tune your streak.</h1>

      <div className="space-y-6">
        <Field label="Display name">
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-midnight/60 border border-cloud-deep/30 rounded-lg px-4 py-3 focus:border-link outline-none" />
        </Field>
        <Field label={`Daily reading goal (minutes) — currently ${goal}`}>
          <input type="range" min={1} max={60} value={goal} onChange={(e) => setGoal(parseInt(e.target.value, 10))} className="w-full accent-[var(--color-moon)]" />
        </Field>
        <Field label="Timezone">
          <input value={tz} onChange={(e) => setTz(e.target.value)} className="w-full bg-midnight/60 border border-cloud-deep/30 rounded-lg px-4 py-3 focus:border-link outline-none font-mono text-sm" />
          <div className="text-cloud-deep text-xs mt-2">Used to bucket your reading into local days for the streak.</div>
        </Field>

        <div className="flex items-center gap-4">
          <button onClick={save} className="bg-star text-night font-medium rounded-full px-6 py-3 hover:bg-moon transition-colors">
            {saved ? "Saved ✓" : "Save"}
          </button>
          {err && <span className="text-red-300 text-sm">{err}</span>}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono mb-2">{label}</div>
      {children}
    </label>
  );
}
