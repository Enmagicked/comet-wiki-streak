"use client";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type Slice = { name: string; value: number };
const PALETTE = ["#E8D9A8", "#7CA8FF", "#B8C8E6", "#5B739E", "#1B2A55", "#F4F1E8"];

export function CategoryDonut({ data }: { data: Slice[] }) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-cloud-deep/30 bg-midnight/60 backdrop-blur-md p-6 h-72 flex items-center justify-center text-cloud-deep">
        No category data yet — read in commute mode to chart your interests.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-cloud-deep/30 bg-midnight/60 backdrop-blur-md p-6 h-72">
      <div className="text-cloud-deep text-xs uppercase tracking-widest font-mono mb-4">your drift</div>
      <ResponsiveContainer width="100%" height="85%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius="55%" outerRadius="90%" paddingAngle={2}
               isAnimationActive animationDuration={1200} animationEasing="ease-out" stroke="none">
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#0E1631", border: "1px solid #1B2A55", borderRadius: 8, color: "#F4F1E8" }}
            formatter={(v, n) => [`${v} min`, n as string]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
