import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
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
    .from("profiles")
    .select("daily_goal_min, timezone, display_name, wiki_username, wiki_editcount, wiki_registered")
    .eq("id", user.id).single();
  const goalMin = profile?.daily_goal_min ?? 5;

  const wikiAccountYears = profile?.wiki_registered
    ? Math.max(0, Math.round(((Date.now() - new Date(profile.wiki_registered).getTime()) / (365.25 * 864e5)) * 10) / 10)
    : null;

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
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono">welcome back{profile?.display_name ? `, ${profile.display_name}` : ""}</div>
          <h1 className="font-display text-4xl mt-1">Your sky tonight.</h1>
        </div>
        {profile?.wiki_username && (
          <a
            href={`https://en.wikipedia.org/wiki/User:${encodeURIComponent(profile.wiki_username)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-full border border-cloud-deep/30 bg-midnight/60 backdrop-blur-md pl-4 pr-5 py-2 hover:border-cloud transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-star shrink-0" aria-hidden>
              <path d="M21.6 6.2h-5.1v.6c.7.05 1.2.2 1.4.45.2.25.15.7-.15 1.4l-2.7 6-2.5-5.8c-.3-.7-.35-1.2-.1-1.5.2-.3.7-.45 1.4-.5v-.6H8.1v.6c.5.05.85.2 1.1.45.25.25.5.7.8 1.4l.5 1.1-2 4.4-2.5-5.9c-.3-.7-.3-1.15-.05-1.4.25-.25.65-.4 1.2-.45v-.6H2.4v.6c.45.05.8.2 1.05.5.25.3.55.85.85 1.6l3.6 8.5h.65l2.5-5.4 2.35 5.4h.65l3.7-8.4c.35-.8.7-1.35 1-1.65.3-.3.65-.45 1.05-.5v-.6Z" />
            </svg>
            <div className="text-left leading-tight">
              <div className="text-star text-sm">{profile.wiki_username}</div>
              <div className="text-cloud-deep text-[11px] font-mono">
                {profile.wiki_editcount != null ? `${profile.wiki_editcount.toLocaleString()} edits` : "verified"}
                {wikiAccountYears != null ? ` · ${wikiAccountYears}y on wiki` : ""}
              </div>
            </div>
          </a>
        )}
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
