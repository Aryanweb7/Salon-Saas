"use client";

import { cn } from "@/lib/utils";

type HealthStatus = "green" | "yellow" | "red";

interface AdminHealthBadgeProps {
  status: HealthStatus;
  label: string;
}

const healthConfig: Record<HealthStatus, { color: string; bgColor: string; label: string }> = {
  green: {
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    label: "Active & Engaged",
  },
  yellow: {
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    label: "Low Usage",
  },
  red: {
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Overdue/Risk",
  },
};

export function AdminHealthBadge({ status, label }: AdminHealthBadgeProps) {
  const config = healthConfig[status];

  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1", config.bgColor)}>
      <div className={cn("h-2 w-2 rounded-full", config.color)} />
      <span className={cn("text-sm font-medium", config.color)}>{label}</span>
    </div>
  );
}
