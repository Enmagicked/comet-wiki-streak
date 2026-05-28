"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const ease = [0.22, 1, 0.36, 1] as const;

export function FeatureSections() {
  return (
    <div id="features" className="relative">
      <FeatureRow kicker="streak mode" title="a daily habit." href="/sign-in" />
      <FeatureRow kicker="commute mode" title="sized to your ride." href="/sign-in" reverse />
      <StatsPreview />
    </div>
  );
}

function FeatureRow({ kicker, title, href, reverse }: { kicker: string; title: string; href: string; reverse?: boolean }) {
  return (
    <section className="py-28 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease }}
        className={`max-w-4xl mx-auto flex items-center gap-6 ${reverse ? "flex-row-reverse text-right" : ""}`}
      >
        <Link href={href} className="group flex-1">
          <div className="text-moon/80 text-xs uppercase tracking-[0.2em] font-mono mb-2">{kicker}</div>
          <h2 className="font-display text-5xl sm:text-6xl text-star group-hover:text-moon transition-colors">
            {title}
          </h2>
        </Link>
        <Link href={href} aria-label={kicker} className={`shrink-0 w-14 h-14 rounded-full border border-cloud-deep/40 flex items-center justify-center hover:border-moon hover:bg-moon/10 transition-colors ${reverse ? "rotate-180" : ""}`}>
          <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-star" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </motion.div>
    </section>
  );
}

function StatsPreview() {
  const cells = Array.from({ length: 7 * 26 }, (_, i) => i);
  // fake line points for the area preview
  const linePts = [4, 9, 7, 12, 14, 11, 16, 18, 13, 20, 22, 19, 24, 21, 26, 23, 28, 25, 30, 27, 33, 31, 35, 32, 38, 36, 40, 37];
  const max = Math.max(...linePts);
  const w = 600, h = 140;
  const step = w / (linePts.length - 1);
  const path = linePts.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (p / max) * h}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <section className="py-28 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-moon/80 text-xs uppercase tracking-[0.2em] font-mono mb-2 text-center">stats</div>
        <h2 className="font-display text-5xl sm:text-6xl text-star text-center mb-12">curiosity, charted.</h2>

        <div className="rounded-2xl border border-cloud-deep/30 bg-midnight/60 backdrop-blur-md p-8">
          {/* heatmap */}
          <div className="grid grid-rows-7 grid-flow-col gap-[3px] mb-10 overflow-hidden">
            {cells.map((c) => {
              const intensity = Math.random();
              const opacity = intensity < 0.3 ? 0.08 : intensity < 0.6 ? 0.4 : intensity < 0.85 ? 0.7 : 1;
              return (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: c * 0.003, ease }}
                  className="w-3 h-3 rounded-[2px] bg-moon"
                />
              );
            })}
          </div>

          {/* line/area chart */}
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-32" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lp-grad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#E8D9A8" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#E8D9A8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path
              d={area}
              fill="url(#lp-grad)"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.6, ease }}
            />
            <motion.path
              d={path}
              stroke="#E8D9A8"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease }}
            />
          </svg>

          {/* records */}
          <div className="grid grid-cols-3 gap-6 mt-8 font-mono">
            <Stat n="147" l="articles" />
            <Stat n="23h" l="read" />
            <Stat n="31" l="longest streak" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="text-center">
      <div className="text-star text-3xl">{n}</div>
      <div className="text-cloud-deep text-[10px] uppercase tracking-widest mt-1">{l}</div>
    </div>
  );
}
