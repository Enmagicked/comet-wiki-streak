"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type Page = { title: string; pageid: number; extract?: string };

export default function ReadIndex() {
  const [picks, setPicks] = useState<Page[]>([]);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Array<{ title: string; pageid: number; snippet: string }>>([]);

  useEffect(() => {
    fetch("/api/wiki/random").then((r) => r.json()).then((j) => setPicks(j.pages ?? []));
  }, []);

  useEffect(() => {
    if (!q.trim()) { setHits([]); return; }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/wiki/search?q=${encodeURIComponent(q)}`);
      const j = await r.json();
      setHits(j.results ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono mb-3">today</div>
      <h1 className="font-display text-4xl mb-8">What will you learn?</h1>

      <input
        value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Search Wikipedia…"
        className="w-full bg-midnight/60 border border-cloud-deep/30 rounded-full px-5 py-3 mb-8 focus:border-link outline-none"
      />

      {hits.length > 0 ? (
        <ul className="space-y-2">
          {hits.map((h) => (
            <li key={h.pageid}>
              <Link href={`/read/${encodeURIComponent(h.title)}`} className="block p-4 rounded-xl border border-cloud-deep/20 hover:bg-midnight/40 transition-colors">
                <div className="font-display text-lg">{h.title}</div>
                <div className="text-cloud text-sm mt-1" dangerouslySetInnerHTML={{ __html: h.snippet }} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono mb-3">or drift somewhere new</div>
          <ul className="space-y-2">
            {picks.map((p, i) => (
              <motion.li
                key={p.pageid}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link href={`/read/${encodeURIComponent(p.title)}`} className="block p-4 rounded-xl border border-cloud-deep/20 hover:bg-midnight/40 transition-colors">
                  <div className="font-display text-lg">{p.title}</div>
                  {p.extract && <div className="text-cloud text-sm mt-1 line-clamp-2">{p.extract}</div>}
                </Link>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
