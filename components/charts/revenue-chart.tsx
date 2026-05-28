"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatCurrency } from "@/lib/utils";

export function RevenueChart({ data }: { data: Array<{ name: string; revenue: number }> }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-64 min-h-64 w-full min-w-0 overflow-hidden rounded-2xl border bg-[var(--background)] p-2 sm:h-72 sm:min-h-72 sm:p-3">
      {mounted ? (
      <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickFormatter={(value) => formatCurrency(Number(value))}
            width={58}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
            }}
          />
          <Bar dataKey="revenue" fill="var(--primary)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      ) : null}
    </div>
  );
}
