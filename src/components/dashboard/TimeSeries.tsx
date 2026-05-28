"use client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Point = { day: string; minutes: number };

export function TimeSeries({ data }: { data: Point[] }) {
  return (
    <div className="rounded-2xl border border-cloud-deep/30 bg-midnight/60 backdrop-blur-md p-6 h-72">
      <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono mb-4">last 30 days</div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="moonFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#E8D9A8" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#E8D9A8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1B2A55" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" stroke="#5B739E" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#5B739E" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "#0E1631", border: "1px solid #1B2A55", borderRadius: 8, color: "#F4F1E8" }}
            labelStyle={{ color: "#B8C8E6" }}
            formatter={(v) => [`${v} min`, "read"]}
          />
          <Area type="monotone" dataKey="minutes" stroke="#E8D9A8" strokeWidth={2} fill="url(#moonFill)"
                isAnimationActive animationDuration={1400} animationEasing="ease-out" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
