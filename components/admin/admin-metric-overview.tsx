"use client";

import { cn } from "@/lib/utils";

interface AdminMetricOverviewProps {
  label: string;
  value: string | number;
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  icon?: React.ReactNode;
}

const colorConfig = {
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  green: "bg-green-500/10 text-green-400 border-green-500/20",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  red: "bg-red-500/10 text-red-400 border-red-500/20",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

export function AdminMetricOverview({
  label,
  value,
  color = "blue",
  icon,
}: AdminMetricOverviewProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        colorConfig[color]
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-400">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
        </div>
        {icon && <div className="text-2xl opacity-50">{icon}</div>}
      </div>
    </div>
  );
}
