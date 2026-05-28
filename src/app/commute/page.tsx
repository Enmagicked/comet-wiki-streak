"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CategoryBrowser } from "@/components/commute/CategoryBrowser";
import { createClient } from "@/lib/supabase/client";

type Mode = "category" | "random" | "custom";

export default function CommuteSetup() {
  const router = useRouter();
  const supabase = createClient();
  const [minutes, setMinutes] = useState(20);
  const [mode, setMode] = useState<Mode>("random");
  const [category, setCategory] = useState("");
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    const cat = mode === "category" ? category : mode === "custom" ? custom : "";
    const r = await fetch(`/api/wiki/queue?minutes=${minutes}&mode=${mode}&category=${encodeURIComponent(cat)}`);
    const j = await r.json();
    if (!j.queue?.length) { setLoading(false); alert("Couldn't build a queue. Try another category."); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/sign-in"); return; }
    const { data, error } = await supabase
      .from("commute_runs")
      .insert({ user_id: user.id, target_minutes: minutes, category: cat || (mode === "random" ? "Surprise me" : null), queue: j.queue, completed_count: 0 })
      .select().single();
    setLoading(false);
    if (error) { alert(error.message); return; }
    router.push(`/commute/run/${data.id}`);
  }

  const presets = [5, 10, 15, 20, 30, 45, 60];

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono">commute mode</div>
      <h1 className="font-display text-4xl mt-1 mb-8">How long is the ride?</h1>

      <section className="mb-10">
        <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono mb-3">duration</div>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setMinutes(p)}
              className={`px-4 py-2 rounded-full border transition-colors ${minutes === p ? "border-moon bg-moon/10 text-moon" : "border-cloud-deep/30 text-cloud hover:border-cloud"}`}
            >
              {p} min
            </button>
          ))}
          <input
            type="number" min={2} max={120} value={minutes}
            onChange={(e) => setMinutes(parseInt(e.target.value || "20", 10))}
            className="w-24 bg-midnight/60 border border-cloud-deep/30 rounded-full px-4 py-2 text-center"
          />
        </div>
      </section>

      <section className="mb-10">
        <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono mb-3">what to read</div>
        <div className="flex gap-2 mb-4">
          {([
            { k: "random",   l: "Surprise me" },
            { k: "category", l: "Browse categories" },
            { k: "custom",   l: "Type a topic" },
          ] as const).map((opt) => (
            <button
              key={opt.k}
              onClick={() => setMode(opt.k)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${mode === opt.k ? "bg-star text-night" : "border border-cloud-deep/30 text-cloud hover:border-cloud"}`}
            >
              {opt.l}
            </button>
          ))}
        </div>

        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="rounded-2xl border border-cloud-deep/20 bg-midnight/40 p-5"
        >
          {mode === "category" && <CategoryBrowser value={category} onChange={setCategory} />}
          {mode === "custom" && (
            <input
              value={custom} onChange={(e) => setCustom(e.target.value)}
              placeholder="e.g. medieval cartography, jazz history, octopus cognition…"
              className="w-full bg-night/60 border border-cloud-deep/30 rounded-lg px-4 py-3 focus:border-link outline-none"
            />
          )}
          {mode === "random" && (
            <div className="text-cloud">We&apos;ll pull a curated handful of random articles and size them to your {minutes} minutes.</div>
          )}
        </motion.div>
      </section>

      <button
        onClick={go}
        disabled={loading || (mode === "category" && !category) || (mode === "custom" && !custom.trim())}
        className="w-full bg-moon text-night font-medium rounded-full py-4 text-lg hover:brightness-110 disabled:opacity-50 transition-all"
      >
        {loading ? "Building your queue…" : `Start ${minutes}-minute commute →`}
      </button>
    </main>
  );
}
