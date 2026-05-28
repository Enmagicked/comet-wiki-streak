import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StreakRing } from "@/components/dashboard/StreakRing";
import { Heatmap } from "@/components/dashboard/Heatmap";
import { TimeSeries } from "@/components/dashboard/TimeSeries";
import { CategoryDonut } from "@/components/dashboard/CategoryDonut";
import { RecordsStrip } from "@/components/dashboard/RecordsStrip";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles").select("daily_goal_min, timezone, display_name").eq("id", user.id).single();
  const goalMin = profile?.daily_goal_min ?? 5;

  const { data: dailyRaw } = await supabase
    .from("daily_streaks")
    .select("day, total_seconds, hit_goal, articles_count")
    .eq("user_id", user.id)
    .order("day", { ascending: false })
    .limit(400);
  const daily = (dailyRaw ?? []).map((d) => ({ ...d, day: d.day as string }));

  const today = new Date().toISOString().slice(0, 10);
  const todayRec = daily.find((d) => d.day === today);
  const todaySec = todayRec?.total_seconds ?? 0;

  // current streak (walk back from today)
  let current = 0;
  {
    const set = new Set(daily.filter((d) => d.hit_goal).map((d) => d.day));
    const d = new Date(); d.setHours(0, 0, 0, 0);
    while (set.has(d.toISOString().slice(0, 10))) { current++; d.setDate(d.getDate() - 1); }
  }
  // longest
  let longest = 0;
  {
    const hits = daily.filter((d) => d.hit_goal).map((d) => d.day).sort();
    let run = 0; let prev: Date | null = null;
    for (const day of hits) {
      const cur = new Date(day + "T00:00:00Z");
      if (prev && (cur.getTime() - prev.getTime()) === 86400000) run++; else run = 1;
      longest = Math.max(longest, run);
      prev = cur;
    }
  }

  // last 30 days time series
  const series: Array<{ day: string; minutes: number }> = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    const rec = daily.find((x) => x.day === k);
    series.push({ day: k.slice(5), minutes: Math.round((rec?.total_seconds ?? 0) / 60) });
  }

  // category breakdown
  const { data: cats } = await supabase
    .from("reading_sessions")
    .select("category, seconds_read")
    .eq("user_id", user.id)
    .not("category", "is", null);
  const catMap = new Map<string, number>();
  (cats ?? []).forEach((s) => { catMap.set(s.category as string, (catMap.get(s.category as string) ?? 0) + (s.seconds_read ?? 0)); });
  const catData = Array.from(catMap.entries()).map(([name, sec]) => ({ name, value: Math.round(sec / 60) })).sort((a, b) => b.value - a.value).slice(0, 6);

  // totals
  const totalSeconds = daily.reduce((a, d) => a + (d.total_seconds ?? 0), 0);
  const totalHours = Math.round(totalSeconds / 360) / 10;
  const articles = daily.reduce((a, d) => a + (d.articles_count ?? 0), 0);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono">welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}</div>
          <h1 className="font-display text-4xl mt-1">Your sky tonight.</h1>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <StreakRing streak={current} todaySec={todaySec} goalMin={goalMin} />
        <RecordsStrip articles={articles} totalHours={totalHours} longest={longest} current={current} />
      </div>

      <Heatmap days={daily} goalMin={goalMin} />

      <div className="grid md:grid-cols-2 gap-6">
        <TimeSeries data={series} />
        <CategoryDonut data={catData} />
      </div>
    </main>
  );
}
