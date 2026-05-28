"use client";
import { motion } from "framer-motion";

export function StreakRing({ streak, todaySec, goalMin }: { streak: number; todaySec: number; goalMin: number }) {
  const goalSec = goalMin * 60;
  const pct = Math.min(1, todaySec / goalSec);
  const m = Math.floor(todaySec / 60);
  const s = (todaySec % 60).toString().padStart(2, "0");
  return (
    <div className="rounded-2xl border border-cloud-deep/30 bg-midnight/60 backdrop-blur-md p-8 flex items-center gap-8">
      <svg viewBox="0 0 100 100" className="w-32 h-32 -rotate-90">
        <circle cx="50" cy="50" r="42" stroke="#1B2A55" strokeWidth="8" fill="none" />
        <motion.circle
          cx="50" cy="50" r="42" stroke="#E8D9A8" strokeWidth="8" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: pct }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ strokeDasharray: 1, strokeDashoffset: 0 }}
        />
      </svg>
      <div>
        <div className="font-mono text-6xl text-star leading-none">{streak}</div>
        <div className="text-cloud-deep text-xs uppercase tracking-widest mt-2">day streak</div>
        <div className="text-cloud text-sm mt-4">{m}:{s} today · goal {goalMin}:00</div>
        {pct >= 1 && <div className="text-moon text-sm mt-1">✓ goal hit</div>}
      </div>
    </div>
  );
}
