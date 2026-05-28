"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Member = { pageid: number; title: string; ns: number };

const ROOTS = [
  "Main topic classifications",
  "Science", "Mathematics", "Technology",
  "History", "Geography", "Society",
  "Arts", "Philosophy", "Religion",
  "Sports", "Entertainment", "Nature",
];

export function CategoryBrowser({ value, onChange }: { value: string; onChange: (cat: string) => void }) {
  const [stack, setStack] = useState<string[]>([]); // breadcrumbs of category titles (no "Category:" prefix)
  const [subcats, setSubcats] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  const current = stack[stack.length - 1] ?? null;

  useEffect(() => {
    if (!current) { setSubcats([]); return; }
    setLoading(true);
    fetch(`/api/wiki/category?c=${encodeURIComponent(current)}&type=subcat`)
      .then((r) => r.json())
      .then((j) => setSubcats(j.items ?? []))
      .finally(() => setLoading(false));
  }, [current]);

  function pickRoot(name: string) {
    setStack([name]);
    onChange(name);
  }
  function drill(sub: Member) {
    const clean = sub.title.replace(/^Category:/, "");
    setStack((s) => [...s, clean]);
    onChange(clean);
  }
  function back() {
    setStack((s) => s.slice(0, -1));
    const next = stack.slice(0, -1);
    onChange(next[next.length - 1] ?? "");
  }

  return (
    <div>
      {stack.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ROOTS.map((r) => (
            <button
              key={r}
              onClick={() => pickRoot(r)}
              className="text-left px-4 py-3 rounded-xl border border-cloud-deep/20 hover:bg-midnight/40 hover:border-link/40 transition-colors"
            >
              {r}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3 flex-wrap text-sm">
            <button onClick={() => { setStack([]); onChange(""); }} className="text-cloud-deep hover:text-cloud">⌂</button>
            {stack.map((s, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="text-cloud-deep">/</span>
                <span className={i === stack.length - 1 ? "text-moon" : "text-cloud"}>{s}</span>
              </span>
            ))}
            {stack.length > 0 && (
              <button onClick={back} className="ml-auto text-cloud-deep hover:text-cloud text-xs">← back</button>
            )}
          </div>
          {loading ? (
            <div className="text-cloud-deep py-6">Loading subcategories…</div>
          ) : subcats.length === 0 ? (
            <div className="text-cloud py-6">No subcategories. <span className="text-moon">Selected: {value}</span></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {subcats.map((s) => (
                <motion.button
                  key={s.pageid}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                  onClick={() => drill(s)}
                  className="text-left px-3 py-2 rounded-lg border border-cloud-deep/20 hover:bg-midnight/40 hover:border-link/40 text-sm transition-colors"
                >
                  {s.title.replace(/^Category:/, "")}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
