"use client";
import { motion } from "framer-motion";

type Day = { day: string; total_seconds: number; hit_goal: boolean };

export function Heatmap({ days, goalMin }: { days: Day[]; goalMin: number }) {
  // Build a 53-week x 7-day grid ending today
  const today = new Date();
  const end = new Date(today); end.setHours(0, 0, 0, 0);
  const cells: Array<{ date: Date; total: number; hit: boolean }> = [];
  const map = new Map(days.map((d) => [d.day, d]));
  const totalDays = 53 * 7;
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const rec = map.get(key);
    cells.push({ date: d, total: rec?.total_seconds ?? 0, hit: rec?.hit_goal ?? false });
  }
  const goalSec = goalMin * 60;

  return (
    <div className="rounded-2xl border border-cloud-deep/30 bg-midnight/60 backdrop-blur-md p-6">
      <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono mb-4">your year</div>
      <div className="overflow-x-auto">
        <div className="grid grid-rows-7 grid-flow-col gap-[3px]" style={{ width: "max-content" }}>
          {cells.map((c, i) => {
            const intensity = c.total === 0 ? 0 : Math.min(1, c.total / (goalSec * 1.5));
            const opacity = c.total === 0 ? 0.08 : 0.25 + intensity * 0.75;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity, scale: 1 }}
                transition={{ duration: 0.4, delay: Math.min(1.5, i * 0.001), ease: [0.22, 1, 0.36, 1] }}
                className="w-[11px] h-[11px] rounded-[2px] bg-moon"
                title={`${c.date.toISOString().slice(0, 10)} — ${Math.round(c.total / 60)} min`}
              />
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 text-xs text-cloud-deep font-mono">
        <span>less</span>
        {[0.1, 0.3, 0.55, 0.8, 1].map((o) => (
          <span key={o} className="w-[11px] h-[11px] rounded-[2px] bg-moon" style={{ opacity: o }} />
        ))}
        <span>more</span>
      </div>
    </div>
  );
}
