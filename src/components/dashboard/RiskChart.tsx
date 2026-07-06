import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { TimelineEntry } from "../../types";

export function RiskChart({ entries }: { entries: TimelineEntry[] }) {
  const data = entries
    .filter((e) => e.weight !== undefined)
    .map((e) => ({
      date: e.date.slice(5),
      weight: e.weight,
      risk: e.riskScore ?? null,
    }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6B4A32" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6B4A32" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#C9B8A0" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#5B4A3A" }}
            axisLine={{ stroke: "#C9B8A0" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontFamily: "IBM Plex Mono", fontSize: 11, fill: "#5B4A3A" }}
            axisLine={false}
            tickLine={false}
            width={34}
          />
          <Tooltip
            contentStyle={{
              background: "#F6F1E7",
              border: "1px solid #C9B8A0",
              borderRadius: 0,
              fontFamily: "IBM Plex Mono",
              fontSize: 12,
            }}
            labelStyle={{ color: "#2B2118" }}
          />
          <Area
            type="monotone"
            dataKey="weight"
            name="Weight (lb)"
            stroke="#6B4A32"
            strokeWidth={2}
            fill="url(#weightFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
