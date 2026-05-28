"use client";
import { useEffect, useRef } from "react";

type Star = {
  x: number; y: number; r: number;
  a: number; tw: number; ph: number;
  warm: boolean;     // moon-tinted vs star-white
  glow: number;      // 0..1 multiplier for halo
};

export function Stars({ density = 200, className = "", warmRatio = 0.18 }: { density?: number; className?: string; warmRatio?: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: Star[] = [];
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: density }, () => {
        // Power-curve sizes: lots of tiny, a few bigger.
        const u = Math.random();
        const r = 0.25 + Math.pow(u, 3) * 2.4;
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r,
          a: 0.35 + Math.random() * 0.55,
          tw: 0.25 + Math.random() * 0.9,
          ph: Math.random() * Math.PI * 2,
          warm: Math.random() < warmRatio,
          glow: r > 1.4 ? 1 : r > 0.9 ? 0.55 : 0.15,
        };
      });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const start = performance.now();
    const draw = (t: number) => {
      const dt = (t - start) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";

      for (const s of stars) {
        const tw = 0.65 + 0.35 * Math.sin(dt * s.tw + s.ph);
        const a = s.a * tw;

        // halo (only for non-tiny stars)
        if (s.glow > 0.2) {
          const haloR = s.r * 7;
          const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR);
          const core = s.warm ? "232,217,168" : "244,241,232";
          grad.addColorStop(0, `rgba(${core},${a * s.glow * 0.55})`);
          grad.addColorStop(0.4, `rgba(${core},${a * s.glow * 0.18})`);
          grad.addColorStop(1, `rgba(${core},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        // core
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.warm ? `rgba(244,228,170,${Math.min(1, a + 0.15)})` : `rgba(248,246,236,${a})`;
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      raf.current = requestAnimationFrame(draw);
    };
    raf.current = requestAnimationFrame(draw);

    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      ro.disconnect();
    };
  }, [density, warmRatio]);

  return <canvas ref={ref} className={`w-full h-full block ${className}`} aria-hidden />;
}
