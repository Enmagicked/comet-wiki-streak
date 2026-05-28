"use client";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const v = useMotionValue(0);
  const rounded = useTransform(v, (latest) => Math.round(latest).toLocaleString() + suffix);
  useEffect(() => { const c = animate(v, value, { duration: 1.4, ease: [0.22, 1, 0.36, 1] }); return () => c.stop(); }, [v, value]);
  return <motion.span>{rounded}</motion.span>;
}

export function RecordsStrip({ articles, totalHours, longest, current }: { articles: number; totalHours: number; longest: number; current: number }) {
  const items = [
    { label: "articles", value: articles },
    { label: "hours read", value: totalHours },
    { label: "longest streak", value: longest },
    { label: "current", value: current },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((it, i) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl border border-cloud-deep/30 bg-midnight/60 backdrop-blur-md p-5"
        >
          <div className="font-mono text-3xl text-star"><Counter value={it.value} /></div>
          <div className="text-cloud-deep text-xs uppercase tracking-widest mt-1">{it.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
