"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function AppointmentsChart({ data }: { data: Array<{ day: string; bookings: number }> }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-64 min-h-64 w-full min-w-0 overflow-hidden rounded-2xl border bg-[var(--background)] p-2 sm:h-72 sm:min-h-72 sm:p-3">
      {mounted ? (
      <ResponsiveContainer width="100%" height="100%" minWidth={240} minHeight={220}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={42} />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--foreground)",
            }}
          />
          <Bar dataKey="bookings" fill="var(--secondary)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      ) : null}
    </div>
  );
}
