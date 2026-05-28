"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EmbeddedReader } from "@/components/EmbeddedReader";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type QueueItem = { title: string; pageid: number; est_minutes: number; extract?: string };

export function CommuteQueuePlayer({ runId, queue, category, target }: { runId: string; queue: QueueItem[]; category: string; target: number }) {
  const router = useRouter();
  const supabase = createClient();
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  const current = queue[idx];
  const progress = ((idx) / queue.length) * 100;

  async function next() {
    const newIdx = idx + 1;
    await supabase.from("commute_runs").update({ completed_count: newIdx }).eq("id", runId);
    if (newIdx >= queue.length) { setDone(true); return; }
    setIdx(newIdx);
  }

  if (done) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono">commute complete</div>
          <h1 className="font-display text-5xl mt-2">Touchdown.</h1>
          <p className="text-cloud mt-4">You read {queue.length} articles across {category}.</p>
          <div className="flex gap-3 justify-center mt-8">
            <button onClick={() => router.push("/dashboard")} className="px-6 py-3 rounded-full bg-star text-night font-medium hover:bg-moon transition-colors">See your stats</button>
            <button onClick={() => router.push("/commute")} className="px-6 py-3 rounded-full border border-cloud-deep/40 hover:border-cloud">Another commute</button>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <div className="relative pb-32">
      {/* progress bar */}
      <div className="fixed top-14 left-0 right-0 z-20 backdrop-blur-md bg-night/70 border-b border-cloud-deep/20">
        <div className="max-w-3xl mx-auto px-6 h-12 flex items-center gap-4">
          <div className="text-xs text-cloud-deep font-mono whitespace-nowrap">{idx + 1} / {queue.length} · {category}</div>
          <div className="flex-1 h-1 bg-cloud-deep/20 rounded-full overflow-hidden">
            <motion.div className="h-full bg-moon" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
          </div>
          <div className="text-xs text-cloud-deep font-mono whitespace-nowrap">{target} min</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.pageid}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <EmbeddedReader
            title={current.title}
            pageid={current.pageid}
            category={category}
            source="commute"
          />
        </motion.div>
      </AnimatePresence>

      {/* next/skip */}
      <div className="fixed bottom-6 left-0 right-0 z-20 px-6">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button onClick={next} className="flex-1 bg-star text-night font-medium rounded-full py-3 hover:bg-moon transition-colors">
            {idx + 1 === queue.length ? "Finish commute" : `Next: ${queue[idx + 1]?.title ?? ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
