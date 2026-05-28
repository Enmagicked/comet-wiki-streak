"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Stars } from "./Stars";
import Link from "next/link";

export function ParallaxHero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Each layer moves at a different rate as the user scrolls past the hero.
  const yStarsFar  = useTransform(scrollYProgress, [0, 1], ["0%", "8%"]);
  const yStarsNear = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const yVideo = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const yFront = useTransform(scrollYProgress, [0, 1], ["0%", "60%"]);
  const yText  = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section ref={ref} className="relative h-[140vh] w-full overflow-hidden">
      {/* 1. Sky gradient — fixed */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-midnight)_0%,_var(--color-night)_70%)]" />

      {/* 2a. Stars — far layer (small, mostly white) */}
      <motion.div style={{ y: yStarsFar }} className="absolute inset-0">
        <Stars density={260} warmRatio={0.1} />
      </motion.div>
      {/* 2b. Stars — near layer (fewer, bigger, warmer, deeper parallax) */}
      <motion.div style={{ y: yStarsNear }} className="absolute inset-0">
        <Stars density={60} warmRatio={0.55} />
      </motion.div>

      {/* 3. Cloud video */}
      <motion.div style={{ y: yVideo }} className="absolute inset-0">
        <video
          src="/hero/clouds-loop.mp4"
          poster="/hero/clouds-poster.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 40%", maskImage: "linear-gradient(to bottom, black 0%, black 92%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 92%, transparent 100%)" }}
        />
        {/* dim the video so text reads cleanly */}
        <div className="absolute inset-0 bg-night/30" />
      </motion.div>

      {/* 4. Foreground cloud silhouette */}
      <motion.svg
        style={{ y: yFront }}
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 w-full h-[40vh] pointer-events-none"
        aria-hidden
      >
        <defs>
          <linearGradient id="fgcloud" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0E1631" stopOpacity="0" />
            <stop offset="60%" stopColor="#070C1B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#070C1B" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M0,160 C120,120 180,200 280,180 C380,160 440,100 560,120 C680,140 760,210 880,200 C1000,190 1080,140 1200,160 C1320,180 1380,210 1440,200 L1440,320 L0,320 Z"
          fill="url(#fgcloud)"
        />
      </motion.svg>

      {/* 5. Headline */}
      <motion.div
        style={{ y: yText, opacity: opacityText }}
        className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10"
      >
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl sm:text-7xl md:text-8xl tracking-tight text-star"
          style={{ fontVariationSettings: '"opsz" 144' }}
        >
          read above<br />the clouds.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-xl text-base sm:text-lg text-cloud"
        >
          wikipedia streak tracker with analytics.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-wrap gap-3 justify-center"
        >
          <Link href="/sign-in" className="px-6 py-3 rounded-full bg-star text-night font-medium hover:bg-moon transition-colors">
            start your streak
          </Link>
          <Link href="#features" className="px-6 py-3 rounded-full border border-cloud-deep/60 text-star hover:border-cloud transition-colors">
            how it works
          </Link>
        </motion.div>
      </motion.div>

      {/* scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cloud-deep text-xs tracking-widest uppercase"
      >
        scroll
      </motion.div>
    </section>
  );
}
